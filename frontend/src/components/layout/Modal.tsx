import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Icon } from "../ui/Icon";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    lastFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
    dialogRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastFocusedRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-40 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm motion-safe:animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto border border-line bg-surface focus:outline-none motion-safe:animate-scale-in"
      >
        <header className="flex items-start justify-between border-b border-line px-6 py-5">
          <div className="space-y-1">
            <p className="eyebrow">Action</p>
            <h2 id={titleId} className="display-sm">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button -mr-2 -mt-1"
            aria-label="Close"
            onClick={onClose}
          >
            <Icon icon={X} size="md" />
          </button>
        </header>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
