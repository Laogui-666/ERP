export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
      </div>
    </div>
  )
}
