import type { CSSProperties } from "react";

type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  /** Pixel size scale; "xl" uses a fluid clamp() for editorial hero use. */
  size?: LogoSize;
  /** Render a stacked "Restored Church / Campus Ministry" wordmark beside the mark. */
  withWordmark?: boolean;
  /** Mark the logo as decorative when wordmark or an adjacent label already names the brand. */
  decorative?: boolean;
  className?: string;
  /** Loading hint — `eager` for above-the-fold positions, `lazy` otherwise. */
  loading?: "eager" | "lazy";
}

const SIZE_PX: Record<Exclude<LogoSize, "xl">, number> = {
  sm: 32,
  md: 48,
  lg: 64,
};

// Fluid size for editorial hero placements (Login right column).
const XL_STYLE: CSSProperties = {
  width: "clamp(200px, 28vw, 360px)",
  height: "clamp(200px, 28vw, 360px)",
};

/**
 * Single source of truth for the Restored Church brand mark. Always renders
 * the full-color circular badge from `/logo.webp`. Pair with the wordmark
 * variant in app chrome (sidebar, mobile header) where the logo carries the
 * identity and the wordmark provides accessible attribution.
 */
export function Logo({
  size = "md",
  withWordmark = false,
  decorative = false,
  className = "",
  loading = "eager",
}: LogoProps) {
  const alt = decorative ? "" : "Restored Church";
  const ariaHidden = decorative ? true : undefined;

  const dims =
    size === "xl"
      ? undefined
      : { width: SIZE_PX[size], height: SIZE_PX[size] };

  const img = (
    <img
      src="/logo.webp"
      alt={alt}
      aria-hidden={ariaHidden}
      loading={loading}
      decoding="async"
      width={dims?.width}
      height={dims?.height}
      style={size === "xl" ? XL_STYLE : undefined}
      className="block shrink-0"
    />
  );

  if (!withWordmark) {
    return <span className={className}>{img}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {img}
      <span className="leading-tight">
        <span className="block font-display text-base tracking-tight text-ink">
          Restored Church
        </span>
        <span className="eyebrow block">Campus Ministry</span>
      </span>
    </span>
  );
}
