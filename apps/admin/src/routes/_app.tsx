import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Banknote,
  BarChart3,
  CalendarClock,
  Database,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { SipLogo } from "../components/logo";
import { meQueryOptions, useLogoutMutation } from "../modules/auth/hooks/use-auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  to?: string;
};

const navigationItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Bantuan Insidental", icon: HeartHandshake, to: "/bantuan-insidental" },
  { label: "Bantuan Rutin", icon: CalendarClock, to: "/bantuan-rutin" },
  { label: "Program", icon: Database, to: "/program" },
  { label: "Mustahik", icon: UsersRound, to: "/mustahik" },
  { label: "Donatur", icon: Banknote, to: "/donatur" },
  { label: "Laporan", icon: BarChart3, to: "/laporan" },
  { label: "Pengaturan", icon: Settings, to: "/pengaturan" },
];

function AppLayout() {
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();
  const meQuery = useQuery(meQueryOptions);

  useEffect(() => {
    if (meQuery.isError) {
      void navigate({ to: "/" });
    }
  }, [meQuery.isError, navigate]);

  if (meQuery.isPending) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 text-muted-foreground text-sm">
        Memuat sesi…
      </div>
    );
  }

  if (meQuery.isError) {
    return null;
  }

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
            <button
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sidebar-foreground/70 text-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => logoutMutation.mutate()}
              type="button"
            >
              <LogOut className="size-4" strokeWidth={1.8} />
              {logoutMutation.isPending ? "Keluar…" : "Keluar"}
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-border border-b bg-background/95 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <Link className="flex items-center gap-3 lg:hidden" to="/dashboard">
                  <SipLogo className="size-10" />
                  <span>
                    <span className="block font-semibold text-sm">SIM-M SIP</span>
                    <span className="block text-muted-foreground text-xs">Konsol manajemen</span>
                  </span>
                </Link>

                <div className="hidden lg:block">
                  <h1 className="font-semibold text-sm">Manajemen SIP</h1>
                  <p className="text-muted-foreground text-xs">Solidaritas Insan Peduli</p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Badge className="hidden sm:inline-flex" variant="secondary">
                    Prototype validasi
                  </Badge>
                  <Button asChild size="sm">
                    <Link to="/pengajuan-baru">Pengajuan baru</Link>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="border-sidebar-border border-b p-5">
      <Link className="flex items-center gap-3" to="/dashboard">
        <SipLogo className="size-11" />
        <span>
          <span className="block font-semibold text-sidebar-accent-foreground">SIM-M SIP</span>
          <span className="block text-muted-foreground text-xs">Solidaritas Insan Peduli</span>
        </span>
      </Link>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, to }: NavItem) {
  const className =
    "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  const activeClassName = "bg-sidebar-primary font-medium text-sidebar-primary-foreground";

  if (to) {
    return (
      <Link
        activeProps={{ className: `${className} ${activeClassName}` }}
        className={className}
        to={to}
      >
        <Icon className="size-4" strokeWidth={1.8} />
        {label}
      </Link>
    );
  }

  return (
    <button className={className} type="button">
      <Icon className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  );
}
