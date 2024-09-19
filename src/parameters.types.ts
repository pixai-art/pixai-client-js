/**
 * The schema fully defines the parameters allowed for the image generation tasks we
 * currently support.
 * You can learn about the specific functions of some parameters by searching for the term
 * "stable diffusion glossary."
 */
export interface TaskParameters {
  /**
   * The number of images to generate in one task.
   */
  batchSize?: number
  /**
   * The Classifier-Free Guidance (CFG) scale controls how closely the AI follows your
   * prompts. Also, when the scale is low, AI tends to produce softer, painterly pictures.
   * We will not strictly limit the value of this parameter. But we recommend keeping the
   * scale below 7.
   */
  cfgScale?: number
  /**
   * Specify the number of last layers of CLIP model to stop at
   */
  clipSkip?: number
  /**
   * ControlNet is a term that could refer to various concepts depending on the context.
   */
  controlNets?: ControlNet[]
  /**
   * Whether to apply the After-Detailer to the image for face fixing.
   */
  enableADetailer?: boolean
  /**
   * Whether to apply ControlNet Tile for image upscaling. Only available when using both the
   * upscale and mediaId field.
   */
  enableTile?: boolean
  /**
   * This field is used to control the multiple of enlargement.
   */
  enlarge?: number
  /**
   * This field control what model to use to enlarge the image.
   */
  enlargeModel?: string
  /**
   * When you are using text to image this field control the size of the result image.
   */
  height?: number
  /**
   * The inputs field is used to call the workflow with the specified inputs.
   */
  inputs?: { [key: string]: any }
  /**
   * IP-adapter (Image Prompt adapter) is a Stable Diffusion add-on for using images as
   * prompts. You can use it to copy the style, composition, or a face in the reference image.
   */
  ipAdapter?: IPAdapter
  /**
   * LatentCouple is a technology to determine the region of the latent space that reflects
   * your sub-prompts. You can reference the [original
   * project](https://github.com/ashen-sensored/stable-diffusion-webui-two-shot/tree/main) to
   * learn the details.
   */
  latentCouple?: LatentCouple
  /**
   * LoRA in the context of stable diffusion is a machine learning technique for fine-tuning
   * generative models to adjust their outputs without extensive retraining. It allows for
   * efficient model customization and control over the generated content.
   * The format of the lora field is a JSON object. The key is the version id of the lora
   * model in the model market. The value is the weight of the lora to be applied. The weight
   * is a float number between 0 and 1.
   */
  lora?: { [key: string]: number }
  /**
   * The mask image you input when using i2i with inpainting. The maskMediaId and maskMediaUrl
   * can only pass in one.
   */
  maskMediaId?: string
  /**
   * The mask image you input when using i2i with inpainting. The maskMediaId and maskMediaUrl
   * can only pass in one.
   */
  maskMediaUrl?: string
  /**
   * The image you input when using i2i. The mediaId and mediaUrl can only pass in one.
   */
  mediaId?: string
  /**
   * The image you input when using i2i. The mediaId and mediaUrl can only pass in one.
   */
  mediaUrl?: string
  /**
   * The id of the model version in model market. You can find the URL of the model version.
   */
  modelId?: string
  /**
   * The negative prompts are used to guide the model to avoid generating certain content.
   * The negative prompts are a short sentence or a few words that describe the content you do
   * not want to see in the generated image.
   * Usually, even if you don't pass this parameter, we will provide some common parameters.
   */
  negativePrompts?: string
  /**
   * What you want to see in the generated image.
   * The prompt is a short sentence or a few words that describe the content of the image.
   *
   * We support partial "attention" or "emphasis" in prompts with round brackets like A1111
   * WebUI or ComfyUI. But Square brackets and curly braces are not supported.
   */
  prompts?: string
  /**
   * The method used to sample from the model. Each model will have its own default values.
   * You can learn about the parameter values we support through our documentation.
   */
  samplingMethod?: string
  /**
   * The number of steps to sample from the model.
   * The higher the value the more specific the picture will be. It also means higher time and
   * cost. Each model will have its own default values.
   * This value is usually between 20 and 25.
   */
  samplingSteps?: number
  /**
   * The seed is a random number that determines the initial state of the model.
   * If you want to generate a similar image, you can use the same seed.
   * If you want to generate a different image, you can use a different seed.
   * If you don't pass this parameter or pass an empty string, we will generate a random seed
   * for you.
   */
  seed?: number | string
  /**
   * The strength field allow you to specify how much the existing picture should be altered
   * to look like a different one. At maximum strength, you will get pictures with the
   * Variation seed, at minimum - pictures with the original Seed
   */
  strength?: number
  /**
   * This field will use Hires Fix to upscale your final image.
   */
  upscale?: number
  /**
   * Sampling steps of the Hires fix phase.
   */
  upscaleDenoisingSteps?: number
  /**
   * Strength of the denoising process in the Hires fix phase.
   */
  upscaleDenoisingStrength?: number
  /**
   * Method used for upscaling the image before applying diffusion model to it.
   */
  upscaler?: string
  /**
   * Sampling method used for Hires Fix phase.
   */
  upscaleSampler?: string
  /**
   * The id of the VAE model version in model market. VAE models can help you adjust the
   * saturations and coloring for your image. Explore with our available options to enhance
   * your images.
   */
  vaeModelId?: string
  /**
   * When you are using text to image this field control the size of the result image.
   */
  width?: number
  workflow?: ComfyUICompatibleWorkflow
  /**
   * You can use this field to specify which workflow you want to execute. The format is
   * `{username}/{workflowUniqueId}:{versionName}`.
   */
  workflowName?: string
  [property: string]: any
}

export interface ControlNet {
  /**
   * The reference image id for the control net.
   */
  mediaId?: string
  mediaUrl?: string
  /**
   * The type of the control net.
   * Currently, we support the following types: `dwpose`, `openpose_full`, `canny`, `depth`,
   * `hed`, `mlsd`, `openpose`, `seg`, `normal`, `scribble`.
   * You can learn the details of each type in our generation panel.
   */
  type?: string
  weight?: number
  [property: string]: any
}

/**
 * IP-adapter (Image Prompt adapter) is a Stable Diffusion add-on for using images as
 * prompts. You can use it to copy the style, composition, or a face in the reference image.
 */
export interface IPAdapter {
  enabled?: boolean
  /**
   * The reference images media id list.
   */
  referenceImages?: string[]
  [property: string]: any
}

/**
 * LatentCouple is a technology to determine the region of the latent space that reflects
 * your sub-prompts. You can reference the [original
 * project](https://github.com/ashen-sensored/stable-diffusion-webui-two-shot/tree/main) to
 * learn the details.
 */
export interface LatentCouple {
  /**
   * The number of divisions in the latent space.
   */
  divisions?: string[]
  /**
   * The positions of the latent couple.
   */
  positions?: string[]
  /**
   * The type of the latent couple. The value can be "rect".
   */
  type?: string
  /**
   * The weights of the latent couple.
   */
  weights?: number[]
  [property: string]: any
}

export interface ComfyUICompatibleWorkflow {}
