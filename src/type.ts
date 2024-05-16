import { TaskBaseFragment } from './generated/graphql'

export type TaskParameters = {
  prompts?: string
  enableTile?: boolean
  mediaId?: string
  negativePrompts?: string
  samplingSteps?: number
  samplingMethod?: string
  cfgScale?: number
  seed?: number | ''
  modelId?: string
  upscale?: number
  upscaleSampler?: string
  upscaler?: string
  upscaleDenoisingStrength?: number
  upscaleDenoisingSteps?: number
  enlarge?: number
  enlargeModel?: string
  width?: number
  height?: number
  strength?: number
  controlNets?: {
    weight?: number
    mediaId?: string
    type?: string
  }[]
  lora?: Record<string, number>
  lbw?: Record<string, number>
  latentCouple?: {
    type?: string
    divisions?: string[]
    positions?: string[]
    weights?: number[]
  }
  maskMediaId?: string
  batchSize?: number
  dynthres?: {
    mimicScale?: number
    thresholdPercentile?: number
    mimicMode?: string
    mimicScaleMin?: number
    cfgMode?: string
    cfgScaleMin?: number
    powerscalePower?: number
  }
  animateDiff?: {
    enabled?: boolean
    smooth?: boolean
    long?: boolean
    v2: {
      motionScale?: number
      denoise?: number
    }
  }
  enableADetailer?: boolean
  clipSkip?: number
  vaeModelId?: string
  refTaskId?: string
}

export interface GenerateImageOptions {
  onUpdate?: (task: TaskBaseFragment) => void
}
