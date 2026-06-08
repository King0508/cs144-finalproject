import { useEffect, useRef, useState, type ElementType, type HTMLAttributes, type ReactNode } from "react";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
  /** Tag a custom intersection threshold; defaults to revealing once 10% is in view. */
  threshold?: number;
}

/**
 * One-shot "fade up as it enters view" wrapper. All motion is driven by the
 * `animate-fade-in-up` CSS utility — the IntersectionObserver only flips a
 * boolean, so animation work stays on the compositor. The component renders
 * its final state immediately when the user has `prefers-reduced-motion: reduce`.
 */
export function Reveal({
  as,
  children,
  threshold = 0.1,
  className = "",
  ...rest
}: RevealProps) {
  const Component: ElementType = as ?? "div";
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Honor OS-level reduced-motion: skip the observer dance and show
    // the content immediately so screen real-estate isn't held back.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    // Older browsers without IntersectionObserver (or SSR) just render visible.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Component
      ref={ref}
      className={[
        visible ? "motion-safe:animate-fade-in-up" : "opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
}
