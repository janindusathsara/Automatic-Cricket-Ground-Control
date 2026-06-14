import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LineChart,
  CloudSun,
  Sprout,
  Cpu,
  Moon,
  Sun,
  Activity,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/weather", label: "Weather", icon: CloudSun },
  { to: "/ground", label: "Ground Monitoring", icon: Sprout },
  { to: "/system", label: "System Status", icon: Cpu },
] as const;

export function AppShell({ children, connected, usingMock }: { children: React.ReactNode; connected: boolean; usingMock: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-64 flex-col gap-2 p-4 border-r border-border/60 glass sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-bold leading-tight">CricketGround</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Control System</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 mt-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 px-2 pb-2">
          <div className="rounded-lg border border-border/60 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={`live-dot inline-block h-2 w-2 rounded-full ${usingMock ? "bg-warning" : connected ? "bg-success" : "bg-destructive"}`} />
              <span className="font-medium">{usingMock ? "Simulated" : connected ? "Live" : "Offline"}</span>
            </div>
            <div className="text-muted-foreground mt-1">
              {usingMock ? "Demo data (no DB records)" : "Firebase RTDB"}
            </div>
          </div>
          <button
            onClick={toggle}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent/40 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div className="text-[10px] text-muted-foreground px-1">
            University of Moratuwa · FYP
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </div>
          <div className="font-display font-bold">CricketGround</div>
        </div>
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent/40">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border/60 grid grid-cols-5">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate max-w-[70px]">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>

      <main className="flex-1 min-w-0 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
