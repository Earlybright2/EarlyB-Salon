import { useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { AdminRoleHeader, AdminRoleShell } from "@/components/AdminRoleLayout";
import type { Salon, Stylist } from "@/lib/types";

function initialsOf(name?: string | null) {
  return (name ?? "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function VerificationAdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const pendingKycQuery = useApiQuery<Stylist[]>("/api/admin/kyc/pending", ["admin", "kyc", "verification"], {
    enabled: isAuthenticated,
  });
  const salonsQuery = useApiQuery<Salon[]>("/api/admin/salons", ["admin", "salons", "verification"], {
    enabled: isAuthenticated,
  });

  const kycMutation = useApiMutation<unknown, { id: number; approved: boolean }>(
    ({ id }) => `/api/admin/kyc/${id}/approve`,
    "post",
  );
  const salonMutation = useApiMutation<unknown, { id: number; verified: boolean }>(
    ({ id }) => `/api/admin/salons/${id}/verify`,
    "post",
  );

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "verification_admin")) {
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

  const pending = pendingKycQuery.data ?? [];
  const salons = salonsQuery.data ?? [];
  const verifiedCount = salons.filter((salon) => salon.isVerified).length;

  return (
    <AdminRoleShell homePath="/admin/verification">
      <AdminRoleHeader
        eyebrow="Verification Admin"
        title="Verification & KYC"
        subtitle="KYC approval and salon verification queue."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Stat strip — one panel, one accent, no decoration that isn't information */}
        <section className="flex divide-x divide-white/10 rounded-md border border-white/10 bg-ebs-bg-card">
          <div className="flex flex-1 items-center gap-3 px-6 py-4">
            <ShieldCheck className="h-4 w-4 text-ebs-text-muted" strokeWidth={1.75} />
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-ebs-text">
                {pending.length}
                {pending.length > 0 && <span className="ml-2 align-middle text-xs font-medium text-ebs-gold">awaiting review</span>}
              </p>
              <p className="text-xs text-ebs-text-muted">Pending KYC</p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-3 px-6 py-4">
            <Building2 className="h-4 w-4 text-ebs-text-muted" strokeWidth={1.75} />
            <div>
              <p className="font-mono text-2xl font-semibold tabular-nums text-ebs-text">{salons.length}</p>
              <p className="text-xs text-ebs-text-muted">
                Salons on platform · {verifiedCount} verified
              </p>
            </div>
          </div>
        </section>

        {/* KYC queue */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
            <h2 className="font-display text-base font-semibold text-ebs-text">
              Barbers &amp; stylists awaiting verification
            </h2>
            <span className="text-xs text-ebs-text-muted">{pending.length} pending</span>
          </div>

          {pendingKycQuery.isLoading ? (
            <p className="py-10 text-center text-sm text-ebs-text-muted">Loading verification requests…</p>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-14 text-center">
              <p className="text-sm font-medium text-ebs-text">All caught up</p>
              <p className="text-xs text-ebs-text-muted">No pending KYC requests right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {pending.map((item) => {
                const processing = kycMutation.isPending && kycMutation.variables?.id === item.id;
                const docs = [
                  { label: "Government ID", url: item.governmentIdUrl, icon: FileText },
                  { label: "Business Certificate", url: item.businessCertificateUrl, icon: BadgeCheck },
                  { label: "Utility Bill", url: item.utilityBillUrl, icon: FileText },
                  { label: "Salon Photo", url: item.salonPhotoUrl, icon: ImageIcon },
                ];
                return (
                  <div key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 font-display text-xs font-semibold text-ebs-text-secondary">
                        {initialsOf(item.displayName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ebs-text">
                            {item.displayName ?? "Unknown"}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ebs-warning">
                            <span className="h-1.5 w-1.5 rounded-full bg-ebs-warning" />
                            Pending
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ebs-text-muted">
                          Submitted {formatDate(item.kycSubmittedAt)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                          {docs.map((doc) => {
                            const available = Boolean(doc.url);
                            return (
                              <a
                                key={doc.label}
                                href={doc.url ?? "#"}
                                target={available ? "_blank" : undefined}
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1.5 text-xs ${
                                  available
                                    ? "text-ebs-text-secondary hover:text-ebs-gold"
                                    : "pointer-events-none text-ebs-text-muted/50"
                                }`}
                              >
                                <doc.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                                {doc.label}
                                {available ? (
                                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                                ) : (
                                  <span className="text-ebs-text-muted/50">— not provided</span>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                      <button
                        onClick={() => kycMutation.mutate({ id: item.id, approved: false })}
                        disabled={processing}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-ebs-text-muted transition hover:bg-ebs-error/10 hover:text-ebs-error disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => kycMutation.mutate({ id: item.id, approved: true })}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded-md bg-ebs-success px-3.5 py-1.5 text-xs font-semibold text-ebs-bg transition hover:opacity-90 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {processing ? "Processing…" : "Approve"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Salon verification */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
            <h2 className="font-display text-base font-semibold text-ebs-text">Salon listings</h2>
            <span className="text-xs text-ebs-text-muted">{salons.length} total</span>
          </div>

          {salons.length === 0 ? (
            <p className="py-10 text-center text-sm text-ebs-text-muted">No salons have been created yet.</p>
          ) : (
            <table className="mt-1 w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-ebs-text-muted">
                  <th className="py-2 font-medium">Business</th>
                  <th className="py-2 font-medium">Location</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {salons.map((salon) => {
                  const processing = salonMutation.isPending && salonMutation.variables?.id === salon.id;
                  return (
                    <tr key={salon.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-ebs-text-muted" strokeWidth={1.75} />
                          <span className="font-medium text-ebs-text">{salon.businessName}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-ebs-text-muted">
                        {[salon.city, salon.state, salon.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {salon.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ebs-teal">
                            <BadgeCheck className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-xs text-ebs-text-muted">Unverified</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {!salon.isVerified && (
                          <button
                            onClick={() => salonMutation.mutate({ id: salon.id, verified: true })}
                            disabled={processing}
                            className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-ebs-text-secondary transition hover:border-ebs-gold/40 hover:text-ebs-gold disabled:opacity-50"
                          >
                            {processing ? "Saving…" : "Verify salon"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </AdminRoleShell>
  );
}