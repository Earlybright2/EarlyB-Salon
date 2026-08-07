import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
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

export default function Register() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("male");
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useApiMutation<unknown, Record<string, unknown>>(
    "/api/auth/register",
    "post",
    {
      onSuccess: () => {
        navigate("/auth/kyc");
      },
      onError: (err) => {
        setError(err.message || "Registration failed. Please try again.");
      },
    },
  );

  useEffect(() => {
    if (role !== "barber" && role !== "stylist") {
      navigate("/auth/signup");
    }
  }, [navigate, role]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    registerMutation.mutate({
      firstName,
      lastName,
      email,
      password,
      gender,
      role,
    });
  };

  return (
    <div className="min-h-screen bg-ebs-bg relative overflow-hidden">
      {/* Background image, bled and feathered into the page — no separate panel */}
      <div className="hidden lg:block absolute inset-0 lg:w-[55%]">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: "url('/login_background.png')",
            maskImage: "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 0%, black 60%, transparent 100%)",
          }}
        />
      </div>

      {/* Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center lg:justify-end px-6 py-12 lg:pr-24">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mx-auto flex items-center justify-center gap-2 mb-6"
          >
            <div className="h-8 w-8 rounded-full border border-ebs-gold" />
            <span className="text-lg font-display font-semibold tracking-wide text-ebs-text transition-colors hover:text-ebs-gold">
              EARLY BRIGHT
            </span>
          </button>

          <div className="space-y-2 text-center mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-ebs-gold">Create Your Account</p>
            <h1 className="text-3xl font-display font-semibold text-ebs-text">
              Step into a world of beauty and community.
            </h1>
            <p className="text-sm text-ebs-text-muted">
              We only use Google and Apple sign in to keep your experience secure and fast.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName" className="text-ebs-text-muted">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-ebs-text-muted">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-ebs-text-muted">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div>
                <Label htmlFor="confirmPassword" className="text-ebs-text-muted">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  className="mt-2"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gender" className="text-ebs-text-muted">Gender</Label>
              <div className="mt-2 flex gap-3">
                {[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ].map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setGender(option.value)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      gender === option.value
                        ? "border-ebs-gold bg-ebs-gold/10 text-ebs-text"
                        : "border-ebs-border bg-transparent text-ebs-text-muted hover:border-ebs-gold/30"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Register now"}
            </Button>

            <div className="my-6 flex items-center gap-3">
              <hr className="flex-1 border-ebs-border" />
              <span className="text-sm text-ebs-text-muted whitespace-nowrap">Or sign up with</span>
              <hr className="flex-1 border-ebs-border" />
            </div>

            <div className="flex items-center justify-center gap-8">
              <button
                type="button"
                onClick={() => (window.location.href = `/api/auth/google${role ? `?role=${role}` : ""}`)}
                className="flex items-center gap-2 text-sm text-ebs-text hover:opacity-80"
              >
                <img src="/google_logo.png" alt="" className="h-5 w-5 rounded-sm object-contain" />
                Google
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = `/api/auth/apple${role ? `?role=${role}` : ""}`)}
                className="flex items-center gap-2 text-sm text-ebs-text hover:opacity-80"
              >
                <AppleLogo />
                Apple
              </button>
            </div>

            <p className="text-sm text-center text-ebs-text-muted pt-2">
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-ebs-gold hover:text-ebs-gold-dark"
                onClick={() => navigate("/auth/login")}
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}