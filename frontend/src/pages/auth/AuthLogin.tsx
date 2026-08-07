import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useApiMutation } from "@/hooks/useApi";

function AppleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

export default function AuthLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useApiMutation<unknown, { email: string; password: string }>(
    "/api/auth/login",
    "post",
    {
      onSuccess: () => {
        navigate("/");
        window.location.reload();
      },
      onError: (err) => {
        setError(err.message || "Login failed. Please try again.");
      },
    },
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-ebs-bg relative overflow-hidden">
      {/* Background image, bled and feathered into the page — no separate panel */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[58%]">
        <img
          src="/login_background.png"
          alt=""
          className="h-full w-full object-cover"
          style={{
            maskImage: "linear-gradient(to right, black 55%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 55%, transparent 100%)",
          }}
        />
      </div>

      {/* Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center lg:justify-end px-6 py-12 lg:pr-24">
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ebs-gold">Sign in</p>
            <h1 className="text-3xl font-display font-semibold text-ebs-text">Welcome back to Early Bright</h1>
            <p className="text-sm text-ebs-text-muted">
              Securely sign in with your email or continue with Google and Apple.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="text-ebs-text-muted">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-ebs-text-muted">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-2"
                required
              />
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
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>

            <div className="my-6 flex items-center gap-3">
              <hr className="flex-1 border-ebs-border" />
              <span className="text-sm text-ebs-text-muted whitespace-nowrap">Or sign in with</span>
              <hr className="flex-1 border-ebs-border" />
            </div>

            <div className="flex items-center justify-center gap-8">
              <button
                type="button"
                onClick={() => (window.location.href = "/api/auth/google")}
                className="flex items-center gap-2 text-sm text-ebs-text hover:opacity-80"
              >
                <img
                  src="/google_logo.png"
                  alt=""
                  className="h-5 w-5 rounded-sm object-contain"
                />
                Google
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = "/api/auth/apple")}
                className="flex items-center gap-2 text-sm text-ebs-text hover:opacity-80"
              >
                <AppleLogo />
                Apple
              </button>
            </div>

            <p className="text-center text-sm text-ebs-text-muted pt-6">
              New here?{' '}
              <button
                type="button"
                className="font-semibold text-ebs-gold hover:text-ebs-gold-dark"
                onClick={() => navigate("/auth/signup")}
              >
                Get started
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}