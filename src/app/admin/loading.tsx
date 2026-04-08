export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-liquid-ocean/20 border-t-liquid-ocean rounded-full animate-spin" />
        <span className="text-sm text-liquid-mist/60">加载中...</span>
      </div>
    </div>
  )
}
