interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';

  return (
    <div className={`relative flex items-center justify-center ${dimensions} group cursor-pointer`}>
      {/* Warm Amber Glow */}
      <div className="absolute inset-0 bg-terracotta-500/20 rounded-xl blur-sm group-hover:bg-terracotta-500/40 transition-all pointer-events-none" />

      {/* Deep Midnight Shell Frame with Amber Accent */}
      <div className="relative w-full h-full bg-[#0d121f] border border-terracotta-500/35 rounded-xl flex items-center justify-center p-2 shadow-md transition-all group-hover:border-terracotta-400 group-hover:shadow-[0_0_16px_rgba(217,107,39,0.35)]">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-terracotta-400 transform group-hover:scale-105 transition-transform duration-200"
        >
          <defs>
            <linearGradient id="amberBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e07a3c" />
              <stop offset="60%" stopColor="#d96b27" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Minimalist Speech Bubble Ring */}
          <path
            d="M16 4C9.37 4 4 9.15 4 15.5C4 18.3 5.15 20.85 7.07 22.75L5.5 27.5L10.5 26C12.18 26.65 14.03 27 16 27C22.63 27 28 21.85 28 15.5C28 9.15 22.63 4 16 4Z"
            stroke="url(#amberBrandGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Clean Calligraphic Arabic "ع" Character Stroke */}
          <path
            d="M19.5 11.5C17.5 11.5 16 12.8 16 14.5C16 16 17.2 16.8 18.5 17.3L16.2 21"
            stroke="url(#amberBrandGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Warm Golden Accent Dot */}
          <circle cx="20.5" cy="14.5" r="1.3" fill="#f59e0b" />
        </svg>
      </div>
    </div>
  );
}

export default function Logo({ size = 'md', showText = true, showSubtitle = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <div className="flex flex-col justify-center">
          <span className="font-display font-extrabold text-lg tracking-tight leading-none text-navy-900 dark:text-sand-50 group-hover:text-terracotta-500 transition-colors">
            ArabBot Studio
          </span>
          {showSubtitle && (
            <span className="font-arabic text-[11px] text-terracotta-600 font-semibold leading-none mt-1" dir="rtl">
              منصة بوتات الواتساب الذكية
            </span>
          )}
        </div>
      )}
    </div>
  );
}
