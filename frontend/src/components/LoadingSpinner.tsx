export default function LoadingSpinner({ fullScreen }: { fullScreen?: boolean }) {
  const cls = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-bg-warm'
    : 'flex items-center justify-center py-12';

  return (
    <div className={cls}>
      <div className="w-8 h-8 border-2 border-ash-200 border-t-terracotta-500 rounded-full animate-spin" />
    </div>
  );
}
