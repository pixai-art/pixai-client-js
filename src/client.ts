import type { GraphQLFormattedError } from 'graphql'
import { Observable, filter, firstValueFrom, map } from 'rxjs'
import {
  type MediaBaseFragment,
  MediaProvider,
  MediaType,
  type Requester,
  type SubscribePersonalEventsSubscription,
  type TaskBaseFragment,
  type UploadMediaInput,
  type UploadMediaMutation,
  getSdk,
} from './generated/graphql'
import type { TaskParameters } from './parameters.types'
import type { GenerateImageOptions } from './type'
import { type RestartableClient, createRestartableClient } from './websocket'

export interface PixAIClientOptions {
  apiKey: string
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  apiBaseUrl?: string
  webSocketBaseUrl?: string
  webSocketImpl?: unknown
}

// biome-ignore lint/suspicious/noEmptyInterface: may be extended in the future
export interface PixAIGraphqlRequestOptions {}

export type PixAIClientRequester = Requester<PixAIGraphqlRequestOptions>

export class PixAIApiError extends Error {
  errors?: ReadonlyArray<GraphQLFormattedError>
  status?: number
  response?: Response
}

export const isEvent = (e: unknown): e is Event => {
  return e != null && typeof e === 'object' && 'target' in e
}

export const isCloseEvent = (e: unknown): e is CloseEvent => {
  return isEvent(e) && 'code' in e && 'reason' in e
}

export const isErrorEvent = (e: unknown): e is ErrorEvent => {
  return isEvent(e) && 'message' in e
}

export class PixAIClient {
  constructor(public opt: PixAIClientOptions) {}

  userAgent = 'PixAIApiClient/1.0.0'

  get apiBaseUrl() {
    return this.opt.apiBaseUrl || 'https://api.pixai.art'
  }

  get webSocketBaseUrl() {
    return this.opt.webSocketBaseUrl || 'wss://gw.pixai.art'
  }

  get fetch() {
    return this.opt.fetch || globalThis.fetch
  }

  protected graphqlWsClients = new Set<RestartableClient>()

  protected subscriptionRequest: PixAIClientRequester = <R, V>(
    query: string,
    variables: V,
  ) => {
    return new Observable<R>(subscriber => {
      const graphqlWsClient = createRestartableClient({
        webSocketImpl: this.opt.webSocketImpl,
        url: `${this.webSocketBaseUrl}/graphql`,
        connectionParams: () => {
          return {
            token: this.opt.apiKey,
          }
        },
      })

      this.graphqlWsClients.add(graphqlWsClient)

      graphqlWsClient.subscribe(
        {
          query,
          variables: variables as Record<string, unknown>,
        },
        {
          next: data => {
            if (data.errors) {
              const err = new PixAIApiError(data.errors[0].message)
              err.errors = data.errors
              subscriber.error(err)
            } else if (data.data) {
              subscriber.next(data.data as R)
            }
          },
          error: e => {
            if (e instanceof Error) {
              subscriber.error(e)
            } else if (isCloseEvent(e)) {
              const err = new PixAIApiError(`WebSocket closed: ${e.reason}`)
              subscriber.error(err)
            } else if (isErrorEvent(e)) {
              subscriber.error(new Error(`WebSocket error: ${e.message}`))
            } else {
              subscriber.error(new Error(`Unknown error: ${e}`))
            }
          },
          complete: () => {
            subscriber.complete()
          },
        },
      )
    })
  }

  protected normalRequest: PixAIClientRequester = async <R, V>(
    query: string,
    variables: V,
  ) => {
    const res = await this.fetch(`${this.apiBaseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.opt.apiKey}`,
        'User-Agent': this.userAgent,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    const data = await res.json()

    if (data.message) {
      const err = new PixAIApiError(data.message)
      err.status = res.status
      err.response = res
      throw err
    }

    if (data.errors?.length) {
      const err = new PixAIApiError(data.errors[0].message)
      err.errors = data.errors
      err.status = res.status
      err.response = res
      throw err
    }

    return data.data
  }

  sendRawRequest: PixAIClientRequester = function (
    this: PixAIClient,
    doc,
    variables,
  ) {
    if (doc.trimStart().startsWith('subscription')) {
      return this.subscriptionRequest(doc, variables)
    }
    return this.normalRequest(doc, variables)
  }

  rawSdk = getSdk(this.sendRawRequest.bind(this))

  protected _$personalEvents?: Observable<SubscribePersonalEventsSubscription>

  get $personalEvents() {
    if (!this._$personalEvents) {
      this._$personalEvents = this.rawSdk.subscribePersonalEvents({})
    }
    return this._$personalEvents
  }

  close() {
    for (const client of this.graphqlWsClients) {
      client.terminate()
    }
    this.graphqlWsClients.clear()
  }

  async createGenerationTask(parameters: TaskParameters) {
    const { createGenerationTask } = await this.rawSdk.createGenerationTask({
      parameters,
    })

    return createGenerationTask
  }

  async cancelGenerationTask(id: string) {
    const { cancelGenerationTask } = await this.rawSdk.cancelGenerationTask({
      id,
    })

    return cancelGenerationTask
  }

  async getTaskById(id: string) {
    const { task } = await this.rawSdk.getTaskById({
      id,
    })

    return task
  }

  async generateImage(
    parameters: TaskParameters,
    options: GenerateImageOptions = {},
  ) {
    const task = await this.createGenerationTask(parameters)

    if (!task)
      throw new PixAIApiError(
        'Failed to create generation task with unknown error.',
      )

    const { onUpdate } = options

    const $taskUpdated = this.$personalEvents.pipe(
      // biome-ignore lint/style/noNonNullAssertion: assertion for type guard only
      map(event => event.personalEvents?.taskUpdated!),
      filter(taskUpdated => taskUpdated?.id === task.id),
    )

    const subscription = onUpdate && $taskUpdated.subscribe(onUpdate)

    const $taskCompleted = $taskUpdated.pipe(
      filter(task => task.status === 'completed'),
    )

    const result = await firstValueFrom($taskCompleted)

    subscription?.unsubscribe()

    return result
  }

  private async getUploadUrl(type: MediaType, provider: MediaProvider) {
    const {
      uploadMedia: { uploadUrl, externalId },
    } = await this.rawSdk.uploadMedia({
      input: {
        type,
        provider,
      },
    })
    if (!uploadUrl) throw new Error('Upload url is not specified')
    return {
      uploadUrl,
      externalId,
    }
  }

  private async registerMedia(input: UploadMediaInput) {
    const { uploadMedia } = await this.rawSdk.uploadMedia({
      input,
    })

    return uploadMedia
  }

  protected async uploadMediaFile(file: File) {
    const provider = MediaProvider.S3

    const type = file.type.startsWith('image')
      ? MediaType.Image
      : file.type.startsWith('video')
        ? MediaType.Video
        : undefined
    if (!type) {
      throw new Error(`Unsupported media type ${type}`)
    }
    const { uploadUrl, externalId } = await this.getUploadUrl(type, provider)
    if (!uploadUrl) {
      throw new Error('Upload url is not specified')
    }

    const formData = new FormData()
    formData.append('file', file)

    const init: RequestInit =
      type === MediaType.Image && provider !== MediaProvider.S3 // S3 uses PUT method
        ? {
            method: 'POST',
            body: formData,
          }
        : {
            method: 'PUT',
            body: file,
          }

    await fetch(uploadUrl, init)

    return await this.uploadMedia({
      type,
      provider,
      externalId: externalId ?? undefined,
    })
  }

  protected async uploadMediaUrl(url: string) {
    const res = await fetch(url)
    const blob = await res.blob()
    const filename = url.split('/').pop() ?? 'file'
    const file = new File([blob], filename, {
      type: blob.type,
    })
    return await this.uploadMediaFile(file)
  }

  async uploadMedia(
    input: UploadMediaInput | File | string,
  ): Promise<UploadMediaMutation['uploadMedia']> {
    if (typeof input === 'string') {
      return this.uploadMediaUrl(input)
    }

    if (input instanceof File) {
      return this.uploadMediaFile(input)
    }

    return this.registerMedia(input)
  }

  async getMediaById(id: string) {
    const { media } = await this.rawSdk.getMediaById({
      id,
    })

    return media
  }

  getPublicUrl(media: MediaBaseFragment) {
    return media.urls?.find(url => url.variant === 'PUBLIC')?.url
  }

  async downloadMedia(media: MediaBaseFragment) {
    const url = this.getPublicUrl(media)
    if (!url) {
      throw new Error('Public url is not available')
    }
    const res = await fetch(url)
    return res.arrayBuffer()
  }

  async getMediaFromTask(task: TaskBaseFragment) {
    if (task.status !== 'completed') {
      throw new Error('Task is not completed')
    }

    if (Array.isArray(task.outputs?.batch)) {
      return await Promise.all(
        task.outputs.batch.map(async (i: { mediaId: string }) => {
          return this.getMediaById(i.mediaId)
        }),
      )
    }

    return await this.getMediaById(task.outputs?.mediaId)
  }
}
