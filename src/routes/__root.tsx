import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/lib/theme";
import { AppShell } from "@/components/AppShell";
import { SensorProvider, useSensors } from "@/lib/sensor-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 text-center max-w-md">
        <h1 className="font-display text-6xl font-black text-primary">404</h1>
        <p className="text-muted-foreground mt-3">This page is out of bounds.</p>
        <a href="/" className="inline-block mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Return to dashboard</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <h1 className="font-display text-xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Automated Cricket Ground Control System" },
      { name: "description", content: "Real-time sensor monitoring and match playability decisions for an instrumented cricket ground — University of Moratuwa engineering project." },
      { name: "author", content: "University of Moratuwa" },
      { property: "og:title", content: "Automated Cricket Ground Control System" },
      { property: "og:description", content: "Live LabVIEW + DAQ + Firebase monitoring of pitch conditions and match playability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;700;800;900&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ShellWithData() {
  const { connected, usingMock } = useSensors();
  return (
    <AppShell connected={connected} usingMock={usingMock}>
      <Outlet />
    </AppShell>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SensorProvider>
          <ShellWithData />
        </SensorProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
