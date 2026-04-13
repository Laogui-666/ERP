'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    __webmcpServerTransport: any
  }
}

export function WebMcpInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initWebMcp = async () => {
      try {
        console.log('Initializing WebMCP...')
        
        const { initializeBuiltinWebMCP } = await import('@opentiny/next-sdk')
        const { createMcpServer, createWebMcpClient, registerVisaTools, registerPermissionTools, registerOrderTools, registerUserTools, registerDocumentTools, registerChatTools, registerNotificationTools, registerDocumentRequirementTools, registerAITools } = await import('./index')
        
        initializeBuiltinWebMCP()
        
        const mcpServer = await createMcpServer()
        console.log('MCP Server created')
        
        await registerVisaTools()
        console.log('Visa tools registered')
        
        await registerPermissionTools()
        console.log('Permission tools registered')
        
        await registerOrderTools()
        console.log('Order tools registered')
        
        await registerUserTools()
        console.log('User tools registered')
        
        await registerDocumentTools()
        console.log('Document tools registered')
        
        await registerChatTools()
        console.log('Chat tools registered')
        
        await registerNotificationTools()
        console.log('Notification tools registered')
        
        await registerDocumentRequirementTools()
        console.log('Document requirement tools registered')
        
        await registerAITools()
        console.log('AI tools registered')
        
        const { sessionId: newSessionId } = await createWebMcpClient()
        setSessionId(newSessionId)
        console.log('WebMCP Client connected, sessionId:', newSessionId)
        
        const serverTransport = window.__webmcpServerTransport
        if (serverTransport) {
          await mcpServer.connect(serverTransport)
          console.log('MCP Server connected to transport')
        }
        
        setIsInitialized(true)
      } catch (err) {
        console.error('Failed to initialize WebMCP:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    initWebMcp()
  }, [])

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && (
        <div className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 text-xs">
          <div className="font-semibold text-gray-700 mb-1">WebMCP Status</div>
          {error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : isInitialized ? (
            <div>
              <div className="text-green-600">✓ Connected</div>
              {sessionId && (
                <div className="text-gray-500 mt-1 truncate max-w-48">
                  Session: {sessionId.slice(0, 8)}...
                </div>
              )}
            </div>
          ) : (
            <div className="text-blue-500">Connecting...</div>
          )}
        </div>
      )}
    </>
  )
}
