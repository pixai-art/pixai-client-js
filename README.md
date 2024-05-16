# PixAI Client

### Installation

Our package name is `@pixai-art/client` and
you can use any of your preferred package managers to install it.

```bash
@pixai-art/client
```

### Usage

Following is a simple example of how you can use the client to generate an image.

For more examples, please refer to the [examples](./examples) directory.

For more information on the API, please refer to the [documentation](https://platform.pixai.art/docs).

```typescript
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
  console.log('Task completed: ', task)
}

main()
```

By design, this library can be used in both Node.js and browser environments. However, since the Node.js environment does not come with a WebSocket implementation, you'll need to install the `ws` or any other similar libraries additionally if you need to use WebSocket to listen for changes in real-time tasks.
