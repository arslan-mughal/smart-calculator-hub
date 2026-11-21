import { createFileRoute, redirect, useLoaderData, useNavigate, useRouter } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, Lock, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { adminLogin, getAdminSession } from "@/lib/admin-auth.functions";
import { settingsFromMatches } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    const session = await getAdminSession();
    if (session.authenticated) throw redirect({ to: "/admin" });
    return { configured: session.configured };
  },
  head: ({ matches }) => {
    const settings = settingsFromMatches(
      matches as unknown as { routeId?: string; loaderData?: unknown }[],
      "/admin",
    );
    return { meta: [{ title: `Admin sign in — ${settings.siteName}` }] };
  },
  component: LoginPage,
});

function LoginPage() {
  const { configured } = Route.useRouteContext();
  const { settings } = useLoaderData({ from: "/admin" });
  const navigate = useNavigate();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await adminLogin({ data: { username, password } });
      if (result.ok) {
        await router.invalidate();
        await navigate({ to: "/admin" });
        return;
      }
      setError(result.error);
      setPassword("");
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="admin-login flex min-h-screen items-center justify-center bg-primary px-4 py-10 font-sans">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-xl bg-accent p-3 text-accent-foreground">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">{settings.siteName} administration</p>
        </div>

        {!configured && (
          <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs leading-5">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p>
              Login is not configured. Copy <code>.env.example</code> to <code>.env</code>, run{" "}
              <code>node scripts/hash-password.mjs "your password"</code>, paste the output and
              restart the server.
            </p>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-username">Username</Label>
            <Input
              id="admin-username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {error && (
            <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p>{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={pending || !configured}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Lock className="size-4" />}
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
