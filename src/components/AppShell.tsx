import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useDB } from "@/lib/store";
import { Home, Receipt, CalendarCheck, ShoppingBasket, CheckCheck, Settings as Cog } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/daily", label: "Milk & Water", icon: CalendarCheck },
  { to: "/shopping", label: "Shopping List", icon: ShoppingBasket },
  { to: "/clearing", label: "Clearing", icon: CheckCheck },
  { to: "/settings", label: "Settings", icon: Cog },
] as const;

export function AppShell() {
  const { settings } = useDB();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/60 backdrop-blur-md bg-background/70 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-saffron to-primary grid place-items-center text-primary-foreground font-display text-lg shadow-warm">
              श
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg">{settings.householdName}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Daily Ledger
              </div>
            </div>
          </Link>
          <div className="flex-1" />
          <div className="hidden sm:block text-sm text-muted-foreground">
            <span className="opacity-70">Hello,</span>{" "}
            <span className="text-foreground font-medium">{settings.currentUser}</span>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
          {nav.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-warm"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        Made with care for {settings.householdName} ·{" "}
        <span className="opacity-70">data stored locally · connect Supabase anytime</span>
      </footer>
    </div>
  );
}
