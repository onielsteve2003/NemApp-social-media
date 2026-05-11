interface NemAppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: {
    wrapper: 'gap-3',
    mark: 'h-10 w-10 rounded-2xl',
    svg: 'h-6 w-6',
    title: 'text-lg',
    subtitle: 'text-[10px]',
  },
  md: {
    wrapper: 'gap-4',
    mark: 'h-14 w-14 rounded-[1.35rem]',
    svg: 'h-8 w-8',
    title: 'text-2xl',
    subtitle: 'text-xs',
  },
  lg: {
    wrapper: 'gap-5',
    mark: 'h-20 w-20 rounded-[1.75rem]',
    svg: 'h-11 w-11',
    title: 'text-4xl',
    subtitle: 'text-sm',
  },
} as const;

export function NemAppLogo({
  size = 'md',
  showWordmark = true,
  className = '',
}: NemAppLogoProps) {
  const styles = sizeMap[size];

  return (
    <div className={`inline-flex items-center ${styles.wrapper} ${className}`}>
      <div
        className={
          `relative flex items-center justify-center overflow-hidden border border-white/20 ` +
          `bg-gradient-to-br from-sky-400 via-cyan-300 to-emerald-300 shadow-[0_20px_60px_rgba(34,211,238,0.28)] ` +
          styles.mark
        }
      >
        <div className="absolute inset-[2px] rounded-[inherit] bg-slate-950/88" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.32),_transparent_58%)]" />
        <svg
          viewBox="0 0 48 48"
          aria-hidden="true"
          className={`relative z-10 ${styles.svg}`}
          fill="none"
        >
          <path
            d="M12 14L19 24L33 18"
            stroke="url(#nemapp-line)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M19 24L17 35L33 18"
            stroke="url(#nemapp-line)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M16 34V13L31 34V13"
            stroke="#F8FAFC"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11.5" cy="13.5" r="3.5" fill="#38BDF8" />
          <circle cx="34.5" cy="17.5" r="3.5" fill="#67E8F9" />
          <circle cx="17.5" cy="35.5" r="3.5" fill="#34D399" />
          <defs>
            <linearGradient id="nemapp-line" x1="8" y1="12" x2="38" y2="36">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#34D399" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showWordmark && (
        <div className="leading-none">
          <div className={`font-black tracking-tight text-white ${styles.title}`}>
            NemApp
          </div>
          <div className={`mt-1 uppercase tracking-[0.28em] text-slate-400 ${styles.subtitle}`}>
            Social Pulse
          </div>
        </div>
      )}
    </div>
  );
}