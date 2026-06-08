import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export function FieldLabel({ children, className = "", ...rest }: LabelProps) {
  return (
    <label
      className={`block text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
}

interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}

export function Field({ label, hint, error, children, id, className = "" }: FieldShellProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={`space-y-2 ${className}`}>
      {label ? <FieldLabel htmlFor={fieldId}>{label}</FieldLabel> : null}
      {/* Children may want to consume the id, so we expose it via context-free
          convention: callers pass `id={fieldId}` themselves when needed. */}
      <div data-field-id={fieldId}>{children}</div>
      {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Boxed = bordered rectangle, default underline-only. */
  boxed?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { boxed = false, className = "", ...rest },
  ref,
) {
  const base = boxed
    ? "block w-full border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-0"
    : "block w-full border-0 border-b border-line-strong bg-transparent px-0 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-0";
  return <input ref={ref} className={`${base} ${className}`} {...rest} />;
});

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  boxed?: boolean;
  children?: ReactNode;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(function SelectInput(
  { boxed = false, className = "", children, ...rest },
  ref,
) {
  const base = boxed
    ? "block w-full appearance-none border border-line-strong bg-surface px-3 py-2.5 pr-8 text-sm text-ink focus:border-ink focus:outline-none focus:ring-0"
    : "block w-full appearance-none border-0 border-b border-line-strong bg-transparent px-0 py-2 pr-6 text-sm text-ink focus:border-ink focus:outline-none focus:ring-0";
  return (
    <div className="relative">
      <select ref={ref} className={`${base} ${className}`} {...rest}>
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ink-soft"
      >
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
});

interface TextareaInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  boxed?: boolean;
}

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  function TextareaInput({ boxed = true, className = "", ...rest }, ref) {
    const base = boxed
      ? "block w-full border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-0"
      : "block w-full border-0 border-b border-line-strong bg-transparent px-0 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-0";
    return <textarea ref={ref} className={`${base} ${className}`} {...rest} />;
  },
);
