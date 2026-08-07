import { Link, useNavigate } from "react-router";
import type { ReactNode } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function displayRole(role?: string) {
  if (!role) return "Admin";
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function initialsOf(name?: string | null) {
  return (name ?? "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminRoleHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const { user, logout } = useAuth();

  const titleBlock = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-gold">{eyebrow}</p>
      <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-ebs-text">{title}</h1>
      {subtitle ? <p className="mt-0.5 text-sm text-ebs-text-muted">{subtitle}</p> : null}
    </>
  );

  return (
    <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0C0C13]/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 pb-3 pt-5 sm:px-6">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <Link to="/" className="group flex items-center gap-2 justify-self-start">
            <div className="h-8 w-8 rounded-full border border-ebs-gold" />
            <div>
              <p className="font-display text-sm font-semibold leading-none tracking-[0.1em] text-ebs-text">
                EARLY BRIGHT
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-ebs-gold">
                Admin Portal
              </p>
            </div>
          </Link>

          <div className="hidden text-center sm:block">{titleBlock}</div>

          <div className="flex items-center gap-3 justify-self-end">
            <div className="hidden items-center gap-2.5 md:flex">
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ebs-gold/30 font-display text-xs font-semibold text-ebs-gold">
                {initialsOf(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ebs-text">
                  {user?.name ?? "Admin"}
                </p>
                <p className="truncate text-[11px] text-ebs-text-muted">{user?.email}</p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 rounded border border-ebs-gold/25 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ebs-gold md:inline-flex">
              <ShieldCheck className="h-3 w-3" />
              {displayRole(user?.role)}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 text-ebs-text-muted transition hover:border-ebs-rose/40 hover:text-ebs-rose"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 border-t border-white/[0.06] pt-3 text-center sm:hidden">{titleBlock}</div>
      </div>
    </div>
  );
}

export function AdminRoleShell({
  children,
  homePath,
}: {
  children: ReactNode;
  homePath: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ebs-bg text-ebs-text">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.2]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="relative z-10">
        {children}

        <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-6 text-xs text-ebs-text-muted sm:flex-row sm:px-6">
          <span>Early Bright Admin Portal</span>
          <button
            onClick={() => navigate(homePath)}
            className="font-semibold text-ebs-gold hover:text-ebs-gold-dark"
          >
            Back to dashboard
          </button>
        </footer>
      </div>
    </div>
  );
}