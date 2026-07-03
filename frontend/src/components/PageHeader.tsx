import type { ReactNode } from 'react';

interface Props {
  title: string;
  desc?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, desc, action }: Props) {
  return (
    <div className="flex items-start justify-between mb-8 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy-900">{title}</h1>
        {desc && <p className="font-body text-sm text-ash-500 mt-1">{desc}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
