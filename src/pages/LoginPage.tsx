import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/api-client";

export default function LoginPage() {
  const { user, login, isInitializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isInitializing && user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Logged in successfully");
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-svh md:grid-cols-2">
      {/* Brand panel — dark "brand chrome" surface, matches the sidebar's
          always-dark identity so black+gold reads as the product's base
          look, not just a dark-mode option. Hidden on small screens. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground md:flex">
        <div
          className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-sidebar-primary/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-sidebar-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-base font-bold text-sidebar-primary-foreground">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Advertiser<span className="text-sidebar-primary">360</span>
          </span>
        </div>
        <div className="relative flex flex-col gap-3">
          <h1 className="max-w-sm text-3xl leading-tight font-semibold tracking-tight">
            Workforce management, done right.
          </h1>
          <p className="max-w-sm text-sm text-sidebar-foreground/60">
            Attendance, leaves, payroll, and your team — all in one place, secured to the
            office.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/40">
          &copy; {new Date().getFullYear()} Advertiser360. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col items-start gap-2 md:items-stretch">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 md:hidden">
              A
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your work email to continue.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} size="lg" className="mt-1 h-10">
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Employee and manager sign-in is restricted to the office location.
          </p>
        </div>
      </div>
    </main>
  );
}
