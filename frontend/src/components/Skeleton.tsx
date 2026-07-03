interface Props {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = 'h-4 w-full', count = 1 }: Props) {
  const base = 'rounded bg-ash-200/50 animate-pulse';
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${base} ${className}`} />
      ))}
    </>
  );
}
