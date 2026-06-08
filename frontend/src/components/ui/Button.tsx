import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Optional leading icon node. */
  leading?: ReactNode;
  /** Optional trailing icon node. */
  trailing?: ReactNode;
  /** Make the button fill its container. */
  block?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-ink text-onInk hover:bg-ink/90",
  secondary:
    "border border-line-strong bg-transparent text-ink hover:border-ink hover:bg-ink/[0.03]",
  ghost: "bg-transparent text-ink hover:bg-ink/[0.04]",
  accent: "bg-accent text-onInk hover:bg-accent/90",
  // Danger keeps the same neutral palette but signals weight via an ink-on-bg
  // outline. Avoids reintroducing a red into the rigid 3-color system.
  danger:
    "border border-ink text-ink hover:bg-ink hover:text-onInk",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs min-h-[32px]",
  md: "px-5 py-2.5 text-sm min-h-[40px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    leading,
    trailing,
    block = false,
    className = "",
    children,
    type,
    ...rest
  },
  ref,
) {
  const classes = [
    // `transition-all` so the active scale animates alongside the color change.
    // `motion-safe:active:scale-[0.98]` gives a tactile press feel without being
    // visible to users who've opted out of motion. Focus-visible draws an
    // explicit accent ring so keyboard users get an unmissable affordance.
    "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-150 ease-smooth motion-safe:active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 motion-safe:disabled:active:scale-100",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} type={type ?? "button"} className={classes} {...rest}>
      {leading}
      {children ? <span>{children}</span> : null}
      {trailing}
    </button>
  );
});
