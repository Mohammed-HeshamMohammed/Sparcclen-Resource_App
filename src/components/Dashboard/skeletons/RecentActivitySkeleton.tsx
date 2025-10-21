export function RecentActivityCardSkeleton({ className }: { className?: string } = {}) {
  return (
    <div className={`h-36 max-w-[420px] w-full mx-auto ${className ?? ''}`}>
      <div className="h-full w-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-100/80 via-gray-200/60 to-gray-100/80 dark:from-gray-800/70 dark:via-gray-700/60 dark:to-gray-800/70 shadow-inner animate-pulse" />
    </div>
  )
}
