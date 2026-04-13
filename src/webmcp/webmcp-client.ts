let webMcpClient: any = null
let sessionId: string | null = null

export const createWebMcpClient = async () => {
  if (typeof window === 'undefined') {
    return { client: null, sessionId: null }
  }

  if (webMcpClient && sessionId) {
    return { client: webMcpClient, sessionId }
  }

  const { WebMcpClient, createMessageChannelPairTransport } = await import('@opentiny/next-sdk')

  const [serverTransport, clientTransport] = createMessageChannelPairTransport()
  ;(window as any).__webmcpServerTransport = serverTransport

  webMcpClient = new WebMcpClient()
  await webMcpClient.connect(clientTransport)

  const result = await webMcpClient.connect({
    agent: true,
    url: 'https://agent.opentiny.design/api/v1/webmcp-trial/mcp'
  })

  sessionId = result.sessionId

  return { client: webMcpClient, sessionId }
}

export const getSessionId = () => sessionId
