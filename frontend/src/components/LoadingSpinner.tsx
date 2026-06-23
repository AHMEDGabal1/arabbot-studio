export default function LoadingSpinner({ fullScreen }: { fullScreen?: boolean }) {
  const cls = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-bg-warm'
    : 'flex items-center justify-center py-24';

  return (
    <div className={cls} role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-ash-200 border-t-terracotta-500 rounded-full animate-spin" />
        <span className="font-body text-sm text-ash-400 animate-pulse">Loading…</span>
      </div>
    </div>
  );
}
