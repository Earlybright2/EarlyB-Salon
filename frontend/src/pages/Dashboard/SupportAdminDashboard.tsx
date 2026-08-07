import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Headset,
  MessageSquare,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { AdminRoleHeader, AdminRoleShell } from "@/components/AdminRoleLayout";
import type { Appointment } from "@/lib/types";

function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? Number(value) || 0 : value;
  return `₦${Math.round(num).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-white/10 bg-ebs-bg-card p-5">{children}</div>;
}

export default function SupportAdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const disputesQuery = useApiQuery<Appointment[]>("/api/admin/disputes", ["admin", "disputes", "support"], {
    enabled: isAuthenticated,
  });

  const resolveMutation = useApiMutation<unknown, { id: number; status: string }>(
    ({ id }) => `/api/admin/disputes/${id}/resolve`,
    "post",
  );

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "support_admin")) {
      navigate("/auth/admin/login");
    }
  }, [isLoading, isAuthenticated, user?.role, navigate]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ebs-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ebs-gold border-t-transparent" />
      </div>
    );
  }

  const disputes = disputesQuery.data ?? [];
  const totalAmount = disputes.reduce((sum, dispute) => sum + (Number(dispute.totalAmount) || 0), 0);

  return (
    <AdminRoleShell homePath="/admin/support">
      <AdminRoleHeader
        eyebrow="Support Admin"
        title="Customer Support"
        subtitle="Resolve disputes and support requests."
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <section className="rounded-lg border border-white/10 border-l-2 border-l-ebs-error bg-ebs-bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-error">Open disputes</p>
              <ShieldAlert className="h-5 w-5 text-ebs-error" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ebs-text">{disputes.length}</p>
            <p className="mt-1 text-xs text-ebs-text-muted">Awaiting resolution</p>
          </section>

          <section className="rounded-lg border border-white/10 border-l-2 border-l-ebs-warning bg-ebs-bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-warning">In dispute value</p>
              <AlertTriangle className="h-5 w-5 text-ebs-warning" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ebs-gold">{formatCurrency(totalAmount)}</p>
            <p className="mt-1 text-xs text-ebs-text-muted">Total amount affected</p>
          </section>

          <section className="rounded-lg border border-white/10 border-l-2 border-l-ebs-teal bg-ebs-bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-teal">Support queue</p>
              <Headset className="h-5 w-5 text-ebs-teal" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ebs-text">0</p>
            <p className="mt-1 text-xs text-ebs-text-muted">Incoming tickets</p>
          </section>
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">Dispute queue</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-ebs-text">
                Payment disputes requiring review
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ebs-text-secondary">
              <RefreshCcw className="h-3 w-3" /> Auto-refreshing
            </span>
          </div>

          {disputesQuery.isLoading ? (
            <Panel>
              <p className="py-10 text-center text-sm text-ebs-text-muted">Loading disputes...</p>
            </Panel>
          ) : disputes.length === 0 ? (
            <Panel>
              <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-ebs-success" strokeWidth={1.75} />
                <p className="font-display text-lg font-medium text-ebs-text">No open disputes</p>
                <p className="text-sm text-ebs-text-muted">All payment disputes are resolved.</p>
              </div>
            </Panel>
          ) : (
            <section className="space-y-3">
              {disputes.map((dispute) => {
                const processing =
                  resolveMutation.isPending && resolveMutation.variables?.id === dispute.id;
                return (
                  <div key={dispute.id} className="rounded-lg border border-white/10 bg-ebs-bg-card p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-ebs-text">
                            {dispute.bookingReference}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded border border-ebs-error/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ebs-error">
                            <Clock className="h-3 w-3" /> Disputed
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ebs-text-muted">Created {formatDate(dispute.createdAt)}</p>
                        {dispute.userNotes && (
                          <p className="mt-3 rounded-md border border-white/[0.06] bg-ebs-bg px-3 py-2 text-sm leading-5 text-ebs-text-secondary">
                            {dispute.userNotes}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-mono text-xl font-semibold tabular-nums text-ebs-gold">
                        {formatCurrency(dispute.totalAmount)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-white/[0.06] pt-4">
                      <button
                        onClick={() => resolveMutation.mutate({ id: dispute.id, status: "refunded" })}
                        disabled={processing}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-ebs-rose/40 bg-ebs-rose/10 px-4 py-2 text-sm font-semibold text-ebs-rose transition hover:bg-ebs-rose/20 disabled:opacity-50"
                      >
                        <RefreshCcw className="h-4 w-4" strokeWidth={2.5} />
                        {processing ? "Processing..." : "Refund customer"}
                      </button>
                      <button
                        onClick={() => resolveMutation.mutate({ id: dispute.id, status: "paid" })}
                        disabled={processing}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-ebs-success/40 bg-ebs-success/10 px-4 py-2 text-sm font-semibold text-ebs-success transition hover:bg-ebs-success/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                        Resolve in favor of stylist
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-md border border-white/[0.06] bg-ebs-bg px-3 py-2 text-xs text-ebs-text-muted">
          <MessageSquare className="h-3.5 w-3.5" />
          Customer inbox and support tickets will appear here once integrated.
        </div>
      </main>
    </AdminRoleShell>
  );
}