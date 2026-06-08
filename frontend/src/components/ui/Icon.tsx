import type { LucideIcon, LucideProps } from "lucide-react";

interface IconProps extends Omit<LucideProps, "size" | "strokeWidth"> {
  icon: LucideIcon;
  /** Size scale tied to the type system: 14 / 16 / 20 / 24. */
  size?: "xs" | "sm" | "md" | "lg";
}

const SIZE_PX: Record<NonNullable<IconProps["size"]>, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Single lucide-react wrapper that enforces the design system's stroke weight
 * (1.5) and four allowed sizes. Use this everywhere — no raw lucide imports
 * in feature components, no inline SVGs, no emojis.
 */
export function Icon({ icon: LucideIconComp, size = "sm", ...rest }: IconProps) {
  return (
    <LucideIconComp
      aria-hidden={rest["aria-label"] ? undefined : true}
      size={SIZE_PX[size]}
      strokeWidth={1.5}
      {...rest}
    />
  );
}
