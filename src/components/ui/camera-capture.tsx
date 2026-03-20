'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
  /** 取景框类型 */
  frameType?: 'passport' | 'photo' | 'free'
}

/**
 * 手机拍照组件
 * 支持前置/后置摄像头切换 + 证件取景引导框
 */
export function CameraCapture({ onCapture, onClose, frameType = 'passport' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    try {
      // 停止之前的流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsReady(true)
      }
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('请允许使用摄像头权限')
        } else if (err.name === 'NotFoundError') {
          setError('未找到摄像头设备')
        } else {
          setError(`摄像头错误: ${err.message}`)
        }
      } else {
        setError('无法启动摄像头')
      }
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [facingMode, startCamera])

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        // 停止摄像头
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
        }
      },
      'image/jpeg',
      0.9,
    )
  }

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
    onClose()
  }

  // 取景框配置
  const frameConfig = {
    passport: { widthPct: 70, heightPct: 45, label: '将护照信息页置于框内', borderRadius: '8px' },
    photo: { widthPct: 50, heightPct: 65, label: '将证件照置于框内', borderRadius: '50%' },
    free: { widthPct: 85, heightPct: 60, label: '将证件置于框内', borderRadius: '8px' },
  }
  const frame = frameConfig[frameType]

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white text-sm font-medium">{frame.label}</span>
        <button
          onClick={toggleCamera}
          className="p-2 rounded-full bg-white/10 text-white"
          title="切换摄像头"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 取景区域 */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <p className="text-white/80 mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* 取景引导框 */}
            {isReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"
                  style={{
                    width: `${frame.widthPct}%`,
                    height: `${frame.heightPct}%`,
                    borderRadius: frame.borderRadius,
                  }}
                />
              </div>
            )}

            {/* 提示文字 */}
            <div className="absolute bottom-0 left-0 right-0 text-center pb-2">
              <p className="text-white/60 text-xs">请保持证件平整、光线充足</p>
            </div>
          </>
        )}
      </div>

      {/* 拍照按钮 */}
      {!error && (
        <div className="flex items-center justify-center py-6">
          <button
            onClick={handleCapture}
            disabled={!isReady}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
          >
            <div className="w-12 h-12 rounded-full border-4 border-gray-800" />
          </button>
        </div>
      )}

      {/* 隐藏的 canvas 用于截图 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>,
    document.body,
  )
}
