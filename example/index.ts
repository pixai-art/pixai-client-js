import assert from 'node:assert'
import fs from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import PixAIClient from '../src'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

const client = new PixAIClient({
  apiKey: 'YOUR_API_KEY',
  webSocketImpl: require('ws'),
})

const main = async () => {
  const prompts = await rl.question(
    'What do you want to generate an image of? ',
  )

  console.log('generating image for you...')
  const task = await client.generateImage(
    {
      prompts,
      modelId: '1648918127446573124',
      width: 512,
      height: 512,
    },
    {
      onUpdate: task => {
        console.log(new Date(), 'Task update:', task)
      },
    },
  )

  const media = await client.getMediaFromTask(task)

  assert(media && !Array.isArray(media))

  console.log('downloading generated image...')
  const buffer = await client.downloadMedia(media)

  await fs.writeFile('output.png', Buffer.from(buffer))

  console.log('done! check image named output.png')

  process.exit(0)
}

main()
