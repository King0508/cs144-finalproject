import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { signInWithGoogle } from "../store/firebase";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Logo } from "../components/ui/Logo";

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-bg px-6 py-section sm:px-gutter"
    >
      <div className="flex w-full max-w-xl flex-col items-center text-center motion-safe:animate-fade-in-up">
        <Logo size="lg" decorative />

        <figure className="mt-section">
          <blockquote className="mx-auto max-w-[40ch] font-display leading-relaxed text-ink text-[clamp(1.25rem,2.2vw,1.625rem)]">
            &ldquo;All authority in heaven and on earth has been given to me. Therefore go
            and make disciples of all nations, baptizing them in the name of the Father
            and of the Son and of the Holy Spirit, and teaching them to obey everything I
            have commanded you. And surely I am with you always, to the very end of the age.&rdquo;
          </blockquote>
          <figcaption className="eyebrow mt-4 text-ink-faint">
            Matthew 28:18&ndash;20
          </figcaption>
        </figure>

        <div className="mt-section flex flex-col items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={onSignIn}
            disabled={busy}
            aria-busy={busy}
            trailing={<Icon icon={ArrowUpRight} size="sm" />}
          >
            {busy ? "Signing in" : "Sign in with Google"}
          </Button>
          {error ? (
            <p role="alert" className="text-sm text-ink">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
