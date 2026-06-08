import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "accent" | "outline" | "ink";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-ink/[0.06] text-ink-soft",
  accent: "bg-accent-soft text-accent",
  outline: "border border-line-strong text-ink-soft",
  ink: "bg-ink text-onInk",
};

export function Badge({ tone = "neutral", className = "", children, ...rest }: BadgeProps) {
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em]";
  return (
    <span className={`${base} ${TONE_CLASS[tone]} ${className}`} {...rest}>
      {children}
    </span>
  );
}
