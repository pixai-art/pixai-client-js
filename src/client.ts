import type { GraphQLFormattedError } from 'graphql'
import { Observable, filter, firstValueFrom, map } from 'rxjs'
import {
  Requester,
  SubscribePersonalEventsSubscription,
  getSdk,
} from './generated/graphql'
import { GenerateImageOptions, TaskParameters } from './type'
import { RestartableClient, createRestartableClient } from './websocket'

export interface PixAIClientOptions {
  apiKey: string
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  apiBaseUrl?: string
  webSocketBaseUrl?: string
  webSocketImpl?: unknown
}

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
        url: this.webSocketBaseUrl + '/graphql',
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
            console.log(e)
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
    const res = await this.fetch(this.apiBaseUrl + '/graphql', {
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

  protected getRequester(): PixAIClientRequester {
    return (doc, variables) => {
      if (doc.trimStart().startsWith('subscription')) {
        return this.subscriptionRequest(doc, variables)
      }
      return this.normalRequest(doc, variables)
    }
  }

  rawSdk = getSdk(this.getRequester())

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

  async generateImage(
    parameters: TaskParameters,
    options: GenerateImageOptions = {},
  ) {
    const { createGenerationTask: task } =
      await this.rawSdk.createGenerationTask({
        parameters: {
          ...parameters,
          priority: 1000,
        },
      })

    if (!task)
      throw new PixAIApiError(
        'Failed to create generation task with unknown error.',
      )

    const { onUpdate } = options

    const $taskUpdated = this.$personalEvents.pipe(
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
}
