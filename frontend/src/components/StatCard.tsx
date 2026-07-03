import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'terracotta' | 'gold' | 'navy' | 'ash';
}

const styles: Record<string, { bg: string; iconBg: string; border: string }> = {
  terracotta: { bg: 'bg-terracotta-500/8', iconBg: 'bg-terracotta-500', border: 'border-terracotta-500/20' },
  gold: { bg: 'bg-gold-400/8', iconBg: 'bg-gold-500', border: 'border-gold-400/20' },
  navy: { bg: 'bg-navy-500/8', iconBg: 'bg-navy-500', border: 'border-navy-500/20' },
  ash: { bg: 'bg-ash-200/30', iconBg: 'bg-ash-400', border: 'border-ash-300/30' },
};

export default function StatCard({ label, value, icon: Icon, accent = 'terracotta' }: Props) {
  const s = styles[accent];
  return (
    <div className={`card card-hover p-5 animate-fade-up tilt-3d`}>
      <div className={`absolute -top-6 -right-6 w-16 h-16 ${s.bg} rounded-full`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="font-body text-xs font-medium text-ash-400 tracking-wider uppercase">{label}</p>
          <p className="font-display text-3xl font-semibold text-navy-900 mt-1.5">{value}</p>
        </div>
        <div className={`w-10 h-10 ${s.iconBg} rounded-lg flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
