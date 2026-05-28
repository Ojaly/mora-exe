/**
 * HeaderIcon — 20×20 アイコンを固定枠 20×20 に収めるコンポーネント。
 *
 * 切り替え方法:
 *   USE_IMAGE_ICONS = false  → inline SVG（現在）
 *   USE_IMAGE_ICONS = true   → /public/icons/{name}.svg を <img> で表示
 *
 * 将来 /public/icons/ に自作SVG/PNGを用意したら、
 * USE_IMAGE_ICONS を true にするだけで全箇所が切り替わります。
 */

const USE_IMAGE_ICONS = false;

// ─── Inline SVG library (lucide-style, 24×24 viewBox) ────────────────────────

const ICONS: Record<string, React.ReactElement> = {

  /* COMPOSE CONTROL */
  sliders: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4"  y1="21" x2="4"  y2="14" />
      <line x1="4"  y1="10" x2="4"  y2="3"  />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8"  x2="12" y2="3"  />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3"  />
      <line x1="1"  y1="14" x2="7"  y2="14" />
      <line x1="9"  y1="8"  x2="15" y2="8"  />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),

  /* STYLE PROMPT */
  "file-text": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9"  x2="8" y2="9"  />
    </svg>
  ),

  /* LYRICS */
  music: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6"  cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),

  /* REWRITE TOOLS */
  "refresh-cw": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),

  /* NEGATIVE */
  ban: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),

  /* STRUCTURE */
  "list-tree": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12H11" />
      <path d="M21 6H8" />
      <path d="M21 18H11" />
      <path d="M3 6v4c0 1.1.9 2 2 2h3" />
      <path d="M3 10v6c0 1.1.9 2 2 2h3" />
    </svg>
  ),

  /* PROMPT LIBRARY */
  library: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),

  /* FINE TUNE */
  "sliders-horizontal": (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="4"  x2="14" y2="4"  />
      <line x1="10" y1="4"  x2="3"  y2="4"  />
      <line x1="21" y1="12" x2="12" y2="12" />
      <line x1="8"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="20" x2="16" y2="20" />
      <line x1="12" y1="20" x2="3"  y2="20" />
      <line x1="14" y1="2"  x2="14" y2="6"  />
      <line x1="8"  y1="10" x2="8"  y2="14" />
      <line x1="16" y1="18" x2="16" y2="22" />
    </svg>
  ),

  /* SOURCE ALCHEMY */
  sparkles: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" />
      <path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  ),
};

// ─── Component ────────────────────────────────────────────────────────────────

interface HeaderIconProps {
  /** Icon key (must match ICONS map above, or filename under /public/icons/) */
  name: string;
  /** Optional additional className for the wrapper span */
  className?: string;
}

export default function HeaderIcon({ name, className = "" }: HeaderIconProps) {
  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center w-5 h-5 ${className}`}
    >
      {USE_IMAGE_ICONS ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/icons/${name}.svg`} alt="" width={20} height={20} />
      ) : (
        <span className="w-5 h-5 flex items-center justify-center">
          {ICONS[name] ?? null}
        </span>
      )}
    </span>
  );
}
