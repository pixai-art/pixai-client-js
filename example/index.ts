import { createInterface } from 'readline/promises'
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
  console.log(111, task)
}

main()
