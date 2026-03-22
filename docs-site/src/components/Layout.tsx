import { Link, useRouterState } from "@tanstack/react-router";
import { useTheme } from "../lib/theme";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Playground" },
  { to: "/docs", label: "Docs" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/samples", label: "Samples" },
] as const;

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const router = useRouterState();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ borderColor: "var(--border)", backgroundColor: theme === "dark" ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.85)" }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight" style={{ color: "var(--text)" }}>
            seimei-split
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = router.location.pathname === item.to ||
                (item.to !== "/" && router.location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "font-semibold" : ""
                  }`}
                  style={{
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                    backgroundColor: isActive ? (theme === "dark" ? "rgba(96,165,250,0.1)" : "rgba(59,130,246,0.08)") : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={toggle}
              className="ml-3 p-2 rounded-md transition-colors cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </nav>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggle}
              className="p-2 rounded-md cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? (
                  <>
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </>
                ) : (
                  <>
                    <path d="M3 12h18" />
                    <path d="M3 6h18" />
                    <path d="M3 18h18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden border-t px-4 py-2" style={{ borderColor: "var(--border)" }}>
            {navItems.map((item) => {
              const isActive = router.location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium"
                  style={{ color: isActive ? "var(--accent)" : "var(--text-secondary)" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-6" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm" style={{ color: "var(--text-tertiary)" }}>
          <span>seimei-split</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/tk1024/seimei-split" target="_blank" rel="noopener" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/seimei-split" target="_blank" rel="noopener" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
              npm
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
