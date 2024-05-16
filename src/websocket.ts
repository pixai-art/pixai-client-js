import { Client, ClientOptions, createClient } from 'graphql-ws'

export interface RestartableClient extends Client {
  restart(): void
}

// refer: https://the-guild.dev/graphql/ws/recipes#client-usage-with-graceful-restart
export const createRestartableClient = (
  options: ClientOptions,
): RestartableClient => {
  let restartRequested = false
  let restart = () => {
    restartRequested = true
  }

  const client = createClient({
    ...options,
    on: {
      ...options.on,
      opened: _socket => {
        options.on?.opened?.(_socket)
        const socket = _socket as WebSocket

        restart = () => {
          if (socket.readyState === WebSocket.OPEN) {
            // if the socket is still open for the restart, do the restart
            socket.close(4205, 'Client Restart')
          } else {
            // otherwise the socket might've closed, indicate that you want
            // a restart on the next opened event
            restartRequested = true
          }
        }

        // just in case you were eager to restart
        if (restartRequested) {
          restartRequested = false
          restart()
        }
      },
    },
  })

  return {
    ...client,
    restart: () => restart(),
  }
}
