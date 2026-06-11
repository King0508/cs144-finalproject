import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Icon } from "../components/ui/Icon";

/**
 * Real 404 view rendered inside the app shell, so unknown client-side routes
 * show a proper "not found" page (with navigation still available) instead of
 * silently redirecting. Reachable via the catch-all route in App.tsx.
 */
export function NotFound() {
  return (
    <section
      aria-labelledby="notfound-heading"
      className="mx-auto flex max-w-xl flex-col items-start gap-5 py-section"
    >
      <span className="inline-flex items-center gap-2 text-ink-soft">
        <Icon icon={Compass} size="md" />
        <span className="eyebrow">Error 404</span>
      </span>
      <h1 id="notfound-heading" className="display-lg">
        Page not found.
      </h1>
      <p className="body text-ink-soft">
        The page you were looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link
        to="/chat"
        className="text-ink underline underline-offset-4 transition-colors hover:text-accent"
      >
        Back to chat
      </Link>
    </section>
  );
}
