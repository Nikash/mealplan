import type { MemberIcon as MemberIconType } from "@/lib/types";

const ICON_LABEL: Record<MemberIconType, string> = {
  baby: "Baby",
  son: "Son",
  daughter: "Daughter",
  mom: "Mom",
  dad: "Dad",
};

/** Simple SVG glyphs for family role icons */
export function MemberIcon({
  icon,
  size = 48,
  className,
}: {
  icon: MemberIconType;
  size?: number;
  className?: string;
}) {
  const label = ICON_LABEL[icon];
  return (
    <span
      className={className}
      role="img"
      aria-label={label}
      style={{ width: size, height: size, display: "inline-flex" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {icon === "baby" && (
          <>
            <circle cx="32" cy="28" r="16" fill="currentColor" opacity="0.15" />
            <circle cx="32" cy="26" r="12" fill="currentColor" />
            <circle cx="27" cy="24" r="1.5" fill="var(--bg, #fff)" />
            <circle cx="37" cy="24" r="1.5" fill="var(--bg, #fff)" />
            <path
              d="M27 30c2 2 8 2 10 0"
              stroke="var(--bg, #fff)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <ellipse cx="32" cy="48" rx="14" ry="10" fill="currentColor" opacity="0.85" />
          </>
        )}
        {icon === "son" && (
          <>
            <circle cx="32" cy="20" r="10" fill="currentColor" />
            <path
              d="M16 54c2-12 10-18 16-18s14 6 16 18"
              fill="currentColor"
            />
            <rect x="22" y="8" width="20" height="6" rx="2" fill="currentColor" />
          </>
        )}
        {icon === "daughter" && (
          <>
            <circle cx="32" cy="20" r="10" fill="currentColor" />
            <path
              d="M18 54c1-10 8-16 14-16s13 6 14 16H18z"
              fill="currentColor"
            />
            <path
              d="M22 18c0-8 4-12 10-12s10 4 10 12"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
          </>
        )}
        {icon === "mom" && (
          <>
            <circle cx="32" cy="18" r="10" fill="currentColor" />
            <path
              d="M14 56c2-14 10-20 18-20s16 6 18 20"
              fill="currentColor"
            />
            <path
              d="M20 16c2-10 8-14 12-14 6 0 10 6 12 12"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
          </>
        )}
        {icon === "dad" && (
          <>
            <circle cx="32" cy="20" r="10" fill="currentColor" />
            <path
              d="M14 56c2-14 10-20 18-20s16 6 18 20"
              fill="currentColor"
            />
            <rect x="20" y="6" width="24" height="5" rx="1" fill="currentColor" />
          </>
        )}
      </svg>
    </span>
  );
}

export function iconLabel(icon: MemberIconType): string {
  return ICON_LABEL[icon];
}
