import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useContext();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/");
    },
    onError: (err) => {
      setError(err.message || "Login failed. Please try again.");
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Sign in to Early Bright</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <Button className="w-full" type="submit" size="lg" disabled={loginMutation.status === "pending"}>
              {loginMutation.status === "pending" ? "Signing in..." : "Sign in"}
            </Button>

            <div className="my-4 flex items-center gap-3">
              <hr className="flex-1" />
              <span className="text-sm text-slate-400">or</span>
              <hr className="flex-1" />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => (window.location.href = "/api/auth/google")}
              >
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => (window.location.href = "/api/auth/apple")}
              >
                Continue with Apple
              </Button>
            </div>

            <p className="text-sm text-center text-slate-500">
              New? Enter your email and password to create an account automatically.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
