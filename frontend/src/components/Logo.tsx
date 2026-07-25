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
      {/* Subtle Glow */}
      <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-sm group-hover:bg-emerald-500/35 transition-all pointer-events-none"></div>

      {/* Clean Minimal Badge */}
      <div className="relative w-full h-full bg-[#0b131e] border border-emerald-500/30 rounded-xl flex items-center justify-center p-2 shadow-md transition-all group-hover:border-emerald-400">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-emerald-400 transform group-hover:scale-105 transition-transform duration-200"
        >
          <defs>
            <linearGradient id="minimalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* Minimalist Speech Bubble Ring */}
          <path
            d="M16 4C9.37 4 4 9.15 4 15.5C4 18.3 5.15 20.85 7.07 22.75L5.5 27.5L10.5 26C12.18 26.65 14.03 27 16 27C22.63 27 28 21.85 28 15.5C28 9.15 22.63 4 16 4Z"
            stroke="url(#minimalGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Clean Minimalist Arabic "ع" Stroke */}
          <path
            d="M19.5 11.5C17.5 11.5 16 12.8 16 14.5C16 16 17.2 16.8 18.5 17.3L16.2 21"
            stroke="url(#minimalGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Minimalist Dot */}
          <circle cx="20.5" cy="14.5" r="1.2" fill="#F59E0B" />
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
          <div className="flex items-center gap-1.5">
            <span className="font-display font-extrabold text-white text-lg tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
              ArabBot
            </span>
            <span className="text-gradient-emerald font-display font-extrabold text-lg tracking-tight leading-none">
              Studio
            </span>
          </div>
          {showSubtitle && (
            <span className="font-arabic text-[10px] text-emerald-400/90 font-medium leading-none mt-1" dir="rtl">
              منصة بوتات الواتساب الذكية
            </span>
          )}
        </div>
      )}
    </div>
  );
}
