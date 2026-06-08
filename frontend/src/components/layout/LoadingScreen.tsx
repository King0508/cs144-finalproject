import { Logo } from "../ui/Logo";

interface LoadingScreenProps {
  /** Label announced to assistive technology. */
  label?: string;
}

export function LoadingScreen({ label = "Loading" }: LoadingScreenProps) {
  return (
    <div
      className="grid min-h-screen place-items-center bg-bg px-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4 text-center motion-safe:animate-fade-in">
        <Logo size="md" decorative />
        <p className="eyebrow motion-safe:animate-pulse">{label}</p>
      </div>
    </div>
  );
}
