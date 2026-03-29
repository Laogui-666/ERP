export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <span className="text-sm text-[var(--color-text-placeholder)]">加载中...</span>
      </div>
    </div>
  )
}
