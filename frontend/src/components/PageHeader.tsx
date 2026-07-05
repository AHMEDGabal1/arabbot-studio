import type { ReactNode } from 'react';

interface Props {
  title: string;
  desc?: string;
  descAr?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, desc, descAr, action }: Props) {
  return (
    <div className="flex items-start justify-between mb-8 animate-fade-up">
      <div>
        <h1 className="font-display text-4xl font-bold text-navy-900 tracking-tight">{title}</h1>
        {descAr && <p className="font-arabic text-xs text-navy-400 mt-0.5" dir="rtl">{descAr}</p>}
        {desc && <p className="font-body text-sm text-ash-500 mt-1">{desc}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
