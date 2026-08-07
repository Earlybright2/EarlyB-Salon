import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CalendarDays,
  Clock,
  DollarSign,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApiQuery } from "@/hooks/useApi";
import { AdminRoleHeader, AdminRoleShell } from "@/components/AdminRoleLayout";
import type { RevenueStats, Transaction } from "@/lib/types";

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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "border-ebs-success/30 text-ebs-success",
    pending: "border-ebs-warning/30 text-ebs-warning",
    refunded: "border-ebs-rose/30 text-ebs-rose",
    disputed: "border-ebs-error/30 text-ebs-error",
  };
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${
        styles[status] ?? "border-white/10 text-ebs-text-secondary"
      }`}
    >
      {status}
    </span>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-white/10 bg-ebs-bg-card p-5">{children}</div>;
}

export default function FinanceAdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const revenueQuery = useApiQuery<RevenueStats>("/api/admin/revenue", ["admin", "revenue", "finance"], {
    enabled: isAuthenticated,
  });
  const transactionsQuery = useApiQuery<Transaction[]>(
    "/api/admin/transactions",
    ["admin", "transactions", "finance"],
    { enabled: isAuthenticated },
  );

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "finance_admin")) {
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

  const revenue = revenueQuery.data;
  const transactions = transactionsQuery.data ?? [];

  const paidCount = transactions.filter((tx) => tx.status === "paid").length;
  const pendingCount = transactions.filter((tx) => tx.status === "pending").length;
  const refundedCount = transactions.filter((tx) => tx.status === "refunded").length;

  return (
    <AdminRoleShell homePath="/admin/finance">
      <AdminRoleHeader
        eyebrow="Finance Admin"
        title="Payments & Withdrawals"
        subtitle="Sales, revenue and payout overview."
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Stat cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-white/10 border-l-2 border-l-ebs-gold bg-ebs-bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ebs-text-muted">
                Total revenue
              </p>
              <DollarSign className="h-3.5 w-3.5 text-ebs-text-muted" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-ebs-gold">
              {formatCurrency(revenue?.totalRevenue ?? 0)}
            </p>
            <p className="mt-2 text-[11px] text-ebs-text-muted">Paid bookings only</p>
          </div>

          <div className="rounded-lg border border-white/10 border-l-2 border-l-ebs-warning bg-ebs-bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ebs-text-muted">
                Pending payouts
              </p>
              <Wallet className="h-3.5 w-3.5 text-ebs-text-muted" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-ebs-text">
              {formatCurrency(revenue?.pendingPayouts ?? 0)}
            </p>
            <p className="mt-2 text-[11px] text-ebs-text-muted">Awaiting settlement to stylists</p>
          </div>

          <div className="rounded-lg border border-white/10 border-l-2 border-l-ebs-teal bg-ebs-bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ebs-text-muted">
                Paid transactions
              </p>
              <Banknote className="h-3.5 w-3.5 text-ebs-text-muted" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-ebs-text">
              {paidCount}
            </p>
            <p className="mt-2 text-[11px] text-ebs-text-muted">of {transactions.length} recent</p>
          </div>

          <div className="rounded-lg border border-white/10 border-l-2 border-l-ebs-rose bg-ebs-bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ebs-text-muted">
                Pending / refunded
              </p>
              <ArrowDownToLine className="h-3.5 w-3.5 text-ebs-text-muted" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-ebs-text">
              {pendingCount + refundedCount}
            </p>
            <p className="mt-2 text-[11px] text-ebs-text-muted">Needs attention</p>
          </div>
        </section>

        {/* Order / payout overview */}
        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <Panel>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">Sales</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-ebs-text">Orders revenue</h3>
              </div>
              <ArrowUpFromLine className="h-5 w-5 text-ebs-gold" strokeWidth={1.75} />
            </div>
            <p className="mt-4 font-mono text-3xl font-semibold tabular-nums text-ebs-gold">
              {formatCurrency(revenue?.totalOrdersRevenue ?? 0)}
            </p>
            <p className="mt-2 text-xs leading-5 text-ebs-text-muted">
              The payment gateway is coming soon. Once live, online payments and stylist withdrawals will appear here in real time.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-white/[0.06] bg-ebs-bg px-3 py-2 text-xs text-ebs-text-muted">
              <Clock className="h-3.5 w-3.5" />
              Payouts are currently tracked but not disbursed.
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">Ledger</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-ebs-text">Summary</h3>
              </div>
              <CalendarDays className="h-5 w-5 text-ebs-teal" strokeWidth={1.75} />
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Paid", value: String(paidCount), tone: "text-ebs-success" },
                { label: "Pending", value: String(pendingCount), tone: "text-ebs-warning" },
                { label: "Refunded", value: String(refundedCount), tone: "text-ebs-rose" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-md border border-white/[0.06] bg-ebs-bg px-3 py-2.5">
                  <span className="text-xs uppercase tracking-[0.14em] text-ebs-text-muted">{row.label}</span>
                  <span className={`font-mono text-sm font-semibold tabular-nums ${row.tone}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        {/* Transactions */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">Recent activity</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ebs-text">Latest transactions</h2>
          </div>

          <Panel>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[10px] font-semibold uppercase tracking-[0.16em] text-ebs-text-muted">
                    {["Reference", "Type", "Amount", "Status", "Date"].map((title) => (
                      <th key={title} className="px-3 py-2.5 whitespace-nowrap">{title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/[0.05] transition hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 font-mono text-xs text-ebs-text">{tx.id}</td>
                      <td className="px-3 py-2.5 capitalize text-ebs-text-secondary">{tx.type}</td>
                      <td className="px-3 py-2.5 font-mono font-medium tabular-nums text-ebs-gold">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs tabular-nums text-ebs-text-muted">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-12 text-center text-sm text-ebs-text-muted">
                        No transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>
      </main>
    </AdminRoleShell>
  );
}