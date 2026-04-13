export let mcpServer: any = null

export const createMcpServer = async () => {
  if (typeof window === 'undefined') {
    return null
  }

  if (mcpServer) {
    return mcpServer
  }

  const { WebMcpServer } = await import('@opentiny/next-sdk')
  
  mcpServer = new WebMcpServer({
    name: 'visa-erp-mcp-server',
    version: '1.0.0'
  })

  return mcpServer
}

export const getMcpServer = () => {
  return mcpServer
}
