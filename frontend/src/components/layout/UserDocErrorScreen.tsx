import { AlertTriangle } from "lucide-react";
import { Icon } from "../ui/Icon";

interface UserDocErrorScreenProps {
  error: Error;
}

export function UserDocErrorScreen({ error }: UserDocErrorScreenProps) {
  return (
    <div
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-gutter py-section"
      role="alert"
    >
      <header className="space-y-3">
        <span className="inline-flex items-center gap-2 text-ink-soft">
          <Icon icon={AlertTriangle} size="md" />
          <span className="eyebrow">Account error</span>
        </span>
        <h1 className="display-lg">Couldn't load your account.</h1>
        <p className="body">
          Firestore returned an error reading your user document. The most common causes are below.
        </p>
      </header>

      <ul className="space-y-3 border-t border-line pt-stack text-sm text-ink-soft">
        <li>
          The Firestore database hasn't been created yet — open the Firebase console for{" "}
          <code className="font-mono text-ink">{import.meta.env.VITE_FIREBASE_PROJECT_ID}</code>{" "}
          and choose <strong className="text-ink">Build &rarr; Firestore Database &rarr; Create database</strong>.
        </li>
        <li>
          Security rules haven't been deployed — run{" "}
          <code className="font-mono text-ink">firebase deploy --only firestore:rules,firestore:indexes</code>.
        </li>
        <li>The signed-in account doesn't have access to this Firebase project.</li>
      </ul>

      <pre className="max-w-full overflow-auto border border-line bg-surface p-4 font-mono text-xs text-ink-soft">
        {error.message}
      </pre>
    </div>
  );
}
