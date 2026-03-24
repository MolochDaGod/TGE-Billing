interface TGELogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'mark' | 'invoice';
}

/**
 * T.G.E. Pros vector logo — gold triangle mark with lightbulb.
 * Variants:
 *  - mark:    icon only (triangle + bulb)
 *  - full:    icon + "T.G.E. PROS" wordmark
 *  - invoice: wide header layout for invoices (logo left, company info right)
 */
export function TGELogo({ size = 48, className = '', variant = 'mark' }: TGELogoProps) {
  const gold = '#C8A415';
  const goldLight = '#E8D44D';
  const goldDark = '#A68B10';

  if (variant === 'invoice') {
    return (
      <div className={`flex items-center gap-5 ${className}`}>
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="triGrad" x1="60" y1="8" x2="60" y2="112" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={goldLight} />
              <stop offset="100%" stopColor={gold} />
            </linearGradient>
            <linearGradient id="bulbGrad" x1="60" y1="30" x2="60" y2="88" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={goldLight} />
              <stop offset="100%" stopColor={goldDark} />
            </linearGradient>
          </defs>
          {/* Triangle */}
          <path d="M60 8 L112 100 L8 100 Z" stroke="url(#triGrad)" strokeWidth="7" fill="none" strokeLinejoin="round" />
          {/* Lightbulb body */}
          <ellipse cx="60" cy="54" rx="18" ry="20" fill="url(#bulbGrad)" opacity="0.85" />
          {/* Bulb filament */}
          <path d="M54 54 Q57 46 60 54 Q63 46 66 54" stroke={gold} strokeWidth="2" fill="none" />
          {/* Bulb base */}
          <rect x="53" y="74" width="14" height="6" rx="2" fill={gold} />
          <rect x="55" y="80" width="10" height="3" rx="1.5" fill={goldDark} />
          {/* Rays */}
          {[[-28, -8], [-22, -20], [0, -30], [22, -20], [28, -8]].map(([dx, dy], i) => (
            <line key={i} x1={60 + dx * 0.6} y1={54 + dy * 0.6} x2={60 + dx} y2={54 + dy}
              stroke={gold} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          ))}
        </svg>
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-wider" style={{ color: gold }}>
            T.G.E. PROS
          </span>
          <span className="text-xs text-muted-foreground tracking-wide">
            Professional Electrical &amp; Contractor Services
          </span>
          <span className="text-[10px] text-muted-foreground/70 mt-0.5">
            Texas Master Electrician License #750779
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <TGELogoMark size={size} gold={gold} goldLight={goldLight} goldDark={goldDark} />
        <div className="flex flex-col">
          <span className="font-bold tracking-wider" style={{ color: gold, fontSize: size * 0.4 }}>
            T.G.E.
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wide">PROS</span>
        </div>
      </div>
    );
  }

  return <TGELogoMark size={size} gold={gold} goldLight={goldLight} goldDark={goldDark} className={className} />;
}

function TGELogoMark({ size, gold, goldLight, goldDark, className = '' }: {
  size: number; gold: string; goldLight: string; goldDark: string; className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="triGradM" x1="60" y1="8" x2="60" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={goldLight} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
        <linearGradient id="bulbGradM" x1="60" y1="30" x2="60" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={goldLight} />
          <stop offset="100%" stopColor={goldDark} />
        </linearGradient>
      </defs>
      <path d="M60 8 L112 100 L8 100 Z" stroke="url(#triGradM)" strokeWidth="7" fill="none" strokeLinejoin="round" />
      <ellipse cx="60" cy="54" rx="18" ry="20" fill="url(#bulbGradM)" opacity="0.85" />
      <path d="M54 54 Q57 46 60 54 Q63 46 66 54" stroke={gold} strokeWidth="2" fill="none" />
      <rect x="53" y="74" width="14" height="6" rx="2" fill={gold} />
      <rect x="55" y="80" width="10" height="3" rx="1.5" fill={goldDark} />
      {[[-28, -8], [-22, -20], [0, -30], [22, -20], [28, -8]].map(([dx, dy], i) => (
        <line key={i} x1={60 + dx * 0.6} y1={54 + dy * 0.6} x2={60 + dx} y2={54 + dy}
          stroke={gold} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      ))}
    </svg>
  );
}
