import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiMutation } from "@/hooks/useApi";
import { ADMIN_ROLE_OPTIONS, getAdminDashboardPath } from "@/const";
import type { User } from "@/lib/types";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useApiMutation<
    User,
    { email: string; password: string; role: string }
  >("/api/auth/admin/login", "post", {
    onSuccess: (data) => {
      navigate(getAdminDashboardPath(data?.role));
      window.location.reload();
    },
    onError: (err) => {
      setError(
        err.message || "Login failed. Please check your credentials or access level.",
      );
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password, role });
  };

  return (
    <div className="min-h-screen bg-ebs-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mx-auto flex items-center justify-center gap-2 mb-8"
          >
            <div className="h-8 w-8 rounded-full border border-ebs-gold" />
            <span className="text-lg font-display font-semibold tracking-wide text-ebs-text transition-colors hover:text-ebs-gold">
              EARLY BRIGHT
            </span>
          </button>

          <div className="space-y-2 text-center mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ebs-gold">
              Admin Portal
            </p>
            <h1 className="text-3xl font-display font-semibold text-ebs-text">
              Secure admin sign in
            </h1>
            <p className="text-sm text-ebs-text-muted">
              Restricted to authorized staff and superusers only.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="admin-email" className="text-ebs-text-muted">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@earlybright.com"
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="admin-password" className="text-ebs-text-muted">Password</Label>
              <PasswordInput
                id="admin-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="admin-role" className="text-ebs-text-muted">Admin role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="admin-role" className="mt-2 w-full">
                  <SelectValue placeholder="Select your admin role" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-xs leading-5 text-ebs-text-muted">
                Your role is assigned once and cannot be changed later. Only superuser accounts
                can sign in as <span className="text-ebs-gold">Super Admin</span>.
              </p>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            ) : null}

            <Button
              className="w-full bg-ebs-gold text-black hover:bg-ebs-gold-dark"
              type="submit"
              size="lg"
              disabled={loginMutation.isPending || !role}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in to Admin"}
            </Button>

            <div className="flex items-center justify-center gap-2 pt-4 text-xs text-ebs-text-muted">
              <ShieldCheck className="h-4 w-4 text-ebs-gold" />
              This area is restricted. Unauthorized access is prohibited.
            </div>

            <p className="text-sm text-center text-ebs-text-muted pt-2">
              Not an admin?{" "}
              <button
                type="button"
                className="font-semibold text-ebs-gold hover:text-ebs-gold-dark"
                onClick={() => navigate("/auth/login")}
              >
                Back to customer sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}