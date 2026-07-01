// Entry point — SIP console login. Mocked for the demo: any credentials enter the app
// (no backend). Standalone page, rendered outside the app shell (not under /_app).
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { SipLogo } from "../components/logo";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@sip.or.id");
  const [password, setPassword] = useState("demo1234");
  const [pending, setPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    // Mock auth — no backend. Short delay to feel real, then enter the console.
    setTimeout(() => navigate({ to: "/dashboard" }), 350);
  }

  return (
    <div className="grid min-h-screen bg-muted/40 lg:grid-cols-2">
      {/* brand / value-prop panel */}
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <SipLogo className="size-11" />
          <span>
            <span className="block font-semibold text-sidebar-accent-foreground">SIM-M SIP</span>
            <span className="block text-sidebar-foreground/70 text-xs">
              Solidaritas Insan Peduli
            </span>
          </span>
        </div>

        <div>
          <h2 className="max-w-md font-semibold text-3xl text-sidebar-accent-foreground leading-tight">
            Satu sistem untuk seluruh siklus penyaluran bantuan.
          </h2>
          <p className="mt-4 max-w-md text-sidebar-foreground/80 text-sm leading-6">
            Kelola data amil, mustahik, dan donatur. Lacak setiap kasus dari pengajuan hingga bukti
            penyaluran — lengkap dengan kalkulasi Had Kifayah sesuai standar BAZNAS.
          </p>
        </div>

        <p className="text-sidebar-foreground/60 text-xs">
          © 2026 Solidaritas Insan Peduli · Prototype
        </p>
      </aside>

      {/* login form */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <SipLogo className="size-10" />
            <span>
              <span className="block font-semibold text-sm">SIM-M SIP</span>
              <span className="block text-muted-foreground text-xs">Solidaritas Insan Peduli</span>
            </span>
          </div>

          <h1 className="font-semibold text-2xl tracking-tight">Masuk ke konsol</h1>
          <p className="mt-1.5 text-muted-foreground text-sm">
            Gunakan akun amil Anda untuk mengakses sistem.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sip.or.id"
                type="email"
                value={email}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata sandi</Label>
                <button
                  className="text-muted-foreground text-xs hover:text-foreground"
                  type="button"
                >
                  Lupa sandi?
                </button>
              </div>
              <Input
                autoComplete="current-password"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                value={password}
              />
            </div>
            <Button className="mt-2 w-full" disabled={pending} type="submit">
              {pending ? "Memuat…" : "Masuk"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
