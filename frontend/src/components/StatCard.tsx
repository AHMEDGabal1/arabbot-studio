import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'terracotta' | 'gold' | 'navy' | 'ash';
}

const styles: Record<string, { bg: string; iconBg: string; border: string }> = {
  terracotta: { bg: 'bg-terracotta-500/10', iconBg: 'bg-terracotta-500', border: 'border-terracotta-500/20' },
  gold: { bg: 'bg-gold-400/10', iconBg: 'bg-gold-500', border: 'border-gold-400/20' },
  navy: { bg: 'bg-navy-500/10', iconBg: 'bg-navy-500', border: 'border-navy-500/20' },
  ash: { bg: 'bg-ash-300/30', iconBg: 'bg-ash-400', border: 'border-ash-300/30' },
};

export default function StatCard({ label, value, icon: Icon, accent = 'terracotta' }: Props) {
  const s = styles[accent];
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn("card p-5 relative overflow-hidden group bg-white/70 backdrop-blur-md border border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]", s.border)}
    >
      <div 
        className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-150", s.bg)} 
      />
      <div className="relative flex items-start justify-between z-10">
        <div>
          <p className="font-body text-xs font-semibold text-ash-500 tracking-wider uppercase mb-1">{label}</p>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-3xl font-bold text-navy-900 tracking-tight"
          >
            {value}
          </motion.p>
        </div>
        <motion.div 
          whileHover={{ rotate: 12, scale: 1.1 }}
          className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", s.iconBg)}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
}
