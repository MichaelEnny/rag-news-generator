import Link from "next/link";
import { ReactNode } from "react";

import { UserMenu } from "@/components/user-menu";

type AppShellProps = {
  children: ReactNode;
  currentPath: "/dashboard" | "/sources" | "/pipeline" | "/profile";
  userLabel?: string;
};

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sources", label: "Sources" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/profile", label: "Profile" }
] as const;

export function AppShell({ children, currentPath, userLabel }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">AI News Desk</p>
          <h1>Editorial control room for your AI signal pipeline.</h1>
          <Link href="/" className="home-link">
            Back to landing page
          </Link>
        </div>
        <div className="masthead-note">
          <p>Vercel-native ingest, curation, and delivery</p>
          <p>{userLabel ? `Signed in as ${userLabel}` : "Authenticated workflow"}</p>
          <div className="user-menu-row">
            <UserMenu />
          </div>
        </div>
      </header>

      <nav className="top-nav" aria-label="Primary">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={currentPath === item.href ? "nav-link is-active" : "nav-link"}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main>{children}</main>
    </div>
  );
}
