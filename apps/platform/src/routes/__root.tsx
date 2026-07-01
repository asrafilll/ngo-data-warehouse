import type { QueryClient } from "@tanstack/react-query";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  ClipboardCheck,
  Cloud,
  FileText,
  Home,
  MapPinned,
  Route as RouteIcon,
  ShieldCheck,
  Upload,
  WalletCards,
} from "lucide-react";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
});

const verifierNav = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Tugas Verifikasi", icon: ClipboardCheck },
  { label: "Pengajuan Baru", icon: FileText },
  { label: "Peta Wilayah", icon: MapPinned },
  { label: "Penyaluran", icon: WalletCards },
  { label: "Upload Bukti", icon: Upload },
  { label: "Rute", icon: RouteIcon },
];

function RootLayout() {
  return (
    <div className="min-h-screen bg-[#f4f6f1] text-[#20261f]">
      <div className="grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden border-[#d9ded4] border-r bg-[#fbfcf8] lg:flex lg:flex-col">
          <div className="border-[#d9ded4] border-b p-5">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#1f5f43] font-semibold text-white">
                SIP
              </span>
              <span>
                <span className="block font-semibold">Verifikator</span>
                <span className="block text-xs text-[#69756b]">Field operations</span>
              </span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {verifierNav.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
                    item.active
                      ? "bg-[#e8f2e8] font-medium text-[#1f5f43]"
                      : "text-[#5e6a60] hover:bg-[#f0f3ed] hover:text-[#20261f]"
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
          <div className="border-[#d9ded4] border-t p-4">
            <div className="rounded-lg border border-[#d9ded4] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Cloud className="size-4 text-[#1f5f43]" strokeWidth={1.8} />
                Sync online
              </div>
              <p className="mt-2 text-xs leading-5 text-[#69756b]">
                Draft lapangan disimpan lokal sebelum dikirim ke dashboard pusat.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-[#d9ded4] border-b bg-[#fbfcf8]/95 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <Link to="/" className="flex items-center gap-3 lg:hidden">
                  <span className="grid size-10 place-items-center rounded-lg bg-[#1f5f43] font-semibold text-white">
                    SIP
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">Verifikator</span>
                    <span className="block text-xs text-[#69756b]">Field operations</span>
                  </span>
                </Link>

                <div className="hidden items-center gap-2 text-sm text-[#69756b] lg:flex">
                  <ShieldCheck className="size-4 text-[#1f5f43]" strokeWidth={1.8} />
                  Dashboard verifikasi wilayah
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Badge
                    className="hidden rounded-md border-[#c8d8c8] bg-[#eef6ec] text-[#245c3f] sm:inline-flex"
                    variant="outline"
                  >
                    Bogor
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/login">Login</Link>
                  </Button>
                </div>
              </div>

              <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {verifierNav.slice(0, 6).map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm ${
                        item.active
                          ? "border-[#1f5f43] bg-[#e8f2e8] font-medium text-[#1f5f43]"
                          : "border-[#d9ded4] bg-white text-[#57635a]"
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
