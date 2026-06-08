import type { ElementType, HTMLAttributes, ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  padding?: Padding;
  /** Hairline divider above each child block. */
  divided?: boolean;
  /** Adds a subtle hover lift and border darkening — opt in for clickable cards. */
  interactive?: boolean;
  children?: ReactNode;
}

const PAD_CLASS: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/**
 * Hairline-only surface. No shadow, single 2px radius. The `divided` variant
 * adds 1px separators between direct children for list/settings rows. The
 * `interactive` variant adds a 1px hover lift for cards the user can click;
 * the lift is hidden behind `motion-safe:` so it never fires for users who
 * have opted out of motion.
 */
export function Card({
  as,
  padding = "md",
  divided = false,
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const Component: ElementType = as ?? "section";
  const classes = [
    "border border-line bg-surface",
    PAD_CLASS[padding],
    divided ? "divide-y divide-line" : "",
    interactive
      ? "transition-all duration-200 ease-smooth hover:border-line-strong motion-safe:hover:-translate-y-px"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
