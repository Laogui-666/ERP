import { useState, useCallback } from 'react'
import { useToast } from '@shared/ui/toast'

export function useAIAnalysis() {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const analyzeDocument = useCallback(async (fileId: string, analysisType: string) => {
    setIsAnalyzing(true)
    setAnalysisResult(null)
    
    try {
      const response = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, analysisType })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAnalysisResult(data.data)
        toast('success', 'AI 分析完成')
        return data.data
      } else {
        toast('error', 'AI 分析失败')
        return null
      }
    } catch (error) {
      console.error('AI 分析失败:', error)
      toast('error', 'AI 分析失败')
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [toast])

  return {
    analyzeDocument,
    isAnalyzing,
    analysisResult
  }
}
