import type { ElementType, HTMLAttributes, ReactNode } from "react";

interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: ElementType;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Vertically rhythmed content section. Optional `eyebrow + title + description`
 * header keeps every block of a page composed the same way.
 */
export function Section({
  as,
  eyebrow,
  title,
  description,
  actions,
  className = "",
  children,
  ...rest
}: SectionProps) {
  const Component: ElementType = as ?? "section";
  return (
    <Component className={`space-y-stack ${className}`} {...rest}>
      {eyebrow || title || description || actions ? (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="display-sm">{title}</h2> : null}
            {description ? <p className="body-sm max-w-prose">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div>{children}</div>
    </Component>
  );
}
