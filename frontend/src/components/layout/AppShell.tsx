import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Calendar as CalendarIcon,
  LogOut,
  MessageSquare,
  Settings as SettingsIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserDoc } from "../../types/domain";
import { signOutCurrent } from "../../store/firebase";
import { labelForRole } from "../../lib/roles";
import { Icon } from "../ui/Icon";
import { Logo } from "../ui/Logo";

interface AppShellProps {
  userDoc: UserDoc;
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const PRIMARY_NAV: readonly NavItem[] = [
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/studies", label: "Studies", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
] as const;

const SETTINGS_NAV: NavItem = { to: "/settings", label: "Settings", icon: SettingsIcon };

function pageTitleFromPath(pathname: string): string {
  if (pathname.startsWith("/chat")) return "Chat";
  if (pathname.startsWith("/studies")) return "Studies";
  if (pathname.startsWith("/calendar")) return "Calendar";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/invitees")) return "Invitee";
  return "Restored Church Campus Ministry";
}

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        [
          // The `before:` stripe is always present; we only swap its color and
          // size, so the accent rail animates in/out instead of popping.
          "group relative flex items-center gap-3 px-gutter py-3 text-sm transition-colors duration-150",
          "before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[2px] before:transition-colors before:duration-200",
          isActive
            ? "text-ink before:bg-accent"
            : "text-ink-soft hover:text-ink before:bg-transparent hover:before:bg-ink/15",
        ].join(" ")
      }
    >
      <Icon icon={item.icon} size="sm" />
      <span className="tracking-tight">{item.label}</span>
    </NavLink>
  );
}

function MobileTab({ item }: { item: NavItem }) {
  return (
    <li>
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          [
            "flex h-full flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.18em] transition-all duration-150 ease-smooth motion-safe:active:scale-[0.94]",
            isActive ? "text-ink" : "text-ink-faint hover:text-ink",
          ].join(" ")
        }
      >
        <Icon icon={item.icon} size="sm" />
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}

export function AppShell({ userDoc }: AppShellProps) {
  const location = useLocation();
  const pageTitle = pageTitleFromPath(location.pathname);
  const allNav = [...PRIMARY_NAV, SETTINGS_NAV];

  // Keep the document title in sync with the active route. Even though this is
  // an SPA (no full reloads), updating <title> per view aids bookmarks, browser
  // history, and screen-reader page announcements.
  useEffect(() => {
    document.title =
      pageTitle === "Restored Church Campus Ministry"
        ? pageTitle
        : `${pageTitle} · Restored Church Campus Ministry`;
  }, [pageTitle]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-onInk"
      >
        Skip to main content
      </a>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/95 px-5 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <Logo size="sm" decorative />
          <div className="leading-tight">
            <p className="eyebrow">Restored Church</p>
            <p className="font-display text-base tracking-tight">{pageTitle}</p>
          </div>
        </div>
      </header>

      <div className="md:flex md:min-h-screen">
        {/* Desktop sidebar */}
        <aside
          aria-label="Primary navigation"
          className="hidden border-r border-line bg-bg md:flex md:w-60 md:shrink-0 md:flex-col"
        >
          <div className="flex items-center gap-3 px-gutter pb-8 pt-section">
            <Logo size="lg" decorative />
            <div className="leading-tight">
              <p className="font-display text-base tracking-tight text-ink">Restored Church</p>
              <p className="eyebrow">Campus Ministry</p>
            </div>
          </div>

          <nav className="flex flex-col gap-px">
            {allNav.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </nav>

          <div className="mt-auto border-t border-line px-gutter py-6">
            <p className="eyebrow mb-2">Signed in</p>
            <p className="truncate text-sm text-ink">{userDoc.displayName}</p>
            <p className="truncate text-xs text-ink-faint">{labelForRole(userDoc.role)}</p>
            <button
              type="button"
              onClick={() => void signOutCurrent()}
              className="group mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft transition-colors duration-150 hover:text-ink"
            >
              <span className="inline-flex transition-transform duration-200 ease-smooth motion-safe:group-hover:-translate-x-0.5">
                <Icon icon={LogOut} size="xs" />
              </span>
              Sign out
            </button>
          </div>
        </aside>

        <main
          id="main-content"
          className="mx-auto w-full max-w-5xl flex-1 px-5 pb-32 pt-section sm:px-gutter md:pb-section md:pt-section-lg focus:outline-none"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur md:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {allNav.map((item) => (
            <MobileTab key={item.to} item={item} />
          ))}
        </ul>
      </nav>
    </div>
  );
}
