import type { QueryClient } from "@tanstack/react-query";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Banknote,
  BarChart3,
  ClipboardList,
  Database,
  FileCheck2,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
});

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Data Bantuan", icon: HeartHandshake },
  { label: "Pengajuan", icon: ClipboardList },
  { label: "Verifikasi", icon: FileCheck2 },
  { label: "Penyaluran", icon: WalletCards },
  { label: "Mustahik", icon: UsersRound },
  { label: "Donatur", icon: Banknote },
  { label: "Program", icon: Database },
  { label: "Laporan", icon: BarChart3 },
  { label: "Pengaturan", icon: Settings },
];

function RootLayout() {
  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="hidden border-sidebar-border border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
          <SidebarBrand />
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigationItems.map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </nav>
          <div className="border-sidebar-border border-t p-4">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-4">
              <div className="flex items-center gap-2 font-medium text-sidebar-accent-foreground text-sm">
                <ShieldCheck className="size-4 text-primary" strokeWidth={1.8} />
                Internal SIP
              </div>
              <p className="mt-2 text-muted-foreground text-xs leading-5">
                Dashboard untuk data bantuan, mustahik, donatur, program, dan laporan operasional.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-border border-b bg-background/95 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <Link className="flex items-center gap-3 lg:hidden" to="/">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary font-semibold text-primary-foreground">
                    SIP
                  </span>
                  <span>
                    <span className="block font-semibold text-sm">SIM-M SIP</span>
                    <span className="block text-muted-foreground text-xs">Management console</span>
                  </span>
                </Link>

                <div className="hidden lg:block">
                  <h1 className="font-semibold text-sm">Dashboard</h1>
                  <p className="text-muted-foreground text-xs">Ringkasan operasional SIP</p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Badge className="hidden sm:inline-flex" variant="secondary">
                    Prototype validasi
                  </Badge>
                  <Button size="sm" type="button">
                    Pengajuan baru
                  </Button>
                </div>
              </div>

              <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navigationItems.slice(0, 8).map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm ${
                        item.active
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "bg-background text-muted-foreground"
                      }`}
                      key={item.label}
                      type="button"
                    >
                      <Icon className="size-4" strokeWidth={1.8} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="border-sidebar-border border-b p-5">
      <Link className="flex items-center gap-3" to="/">
        <span className="grid size-11 place-items-center rounded-xl bg-primary font-semibold text-primary-foreground">
          SIP
        </span>
        <span>
          <span className="block font-semibold text-sidebar-accent-foreground">SIM-M SIP</span>
          <span className="block text-muted-foreground text-xs">Solidaritas Insan Peduli</span>
        </span>
      </Link>
    </div>
  );
}

function SidebarItem({
  active,
  icon: Icon,
  label,
}: {
  active?: boolean;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
        active
          ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
      type="button"
    >
      <Icon className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  );
}
