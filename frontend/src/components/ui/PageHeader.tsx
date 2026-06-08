import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/**
 * Editorial page header used by every routed screen. Establishes the same
 * vertical rhythm across the app: eyebrow → display title → body description
 * → optional action bar, separated from the page body by a single hairline.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="border-b border-line pb-stack">
      <div className="flex flex-col gap-stack md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="display-lg">{title}</h1>
          {description ? <p className="body max-w-prose">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
