export default function LoadingSpinner({ fullScreen }: { fullScreen?: boolean }) {
  const cls = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white'
    : 'flex items-center justify-center py-12';

  return (
    <div className={cls}>
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}
