// Entry point — NGO console login. Standalone page, rendered outside the app shell.
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { SipLogo } from "../components/logo";
import { useLoginMutation } from "../modules/auth/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLoginMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({ identifier: identifier.trim(), password });
  }

  return (
    <div className="grid min-h-screen bg-muted/40 lg:grid-cols-2">
      {/* brand / value-prop panel */}
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <SipLogo className="size-11" />
          <span>
            <span className="block font-semibold text-sidebar-accent-foreground">SIM-M NGO</span>
            <span className="block text-sidebar-foreground/70 text-xs">Manajemen Bantuan</span>
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

        <p className="text-sidebar-foreground/60 text-xs">© 2026 Manajemen Bantuan · Prototype</p>
      </aside>

      {/* login form */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <SipLogo className="size-10" />
            <span>
              <span className="block font-semibold text-sm">SIM-M NGO</span>
              <span className="block text-muted-foreground text-xs">Manajemen Bantuan</span>
            </span>
          </div>

          <h1 className="font-semibold text-2xl tracking-tight">Masuk ke Dashboard</h1>
          <p className="mt-1.5 text-muted-foreground text-sm">
            Gunakan akun amil Anda untuk mengakses sistem.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="identifier">Email atau No. HP</Label>
              <Input
                autoComplete="username"
                id="identifier"
                required
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nama@ngo.or.id / 08xxxxxxxxxx"
                type="text"
                value={identifier}
              />
              <p className="text-muted-foreground text-xs">
                Punya akun SIP Approval (sip.rekapdana.com)? Masuk dengan No. HP dan password yang
                sama.
              </p>
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
                required
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                value={password}
              />
            </div>
            {loginMutation.isError ? (
              <p className="rounded-lg border bg-muted px-3 py-2 text-destructive text-sm">
                {loginMutation.error?.message || "Email/No. HP atau kata sandi tidak sesuai."}
              </p>
            ) : null}
            <Button className="mt-2 w-full" disabled={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? "Memuat…" : "Masuk"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
