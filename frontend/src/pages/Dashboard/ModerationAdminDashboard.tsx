import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Check, CheckCircle2, Flag, MessageSquare, ShieldCheck, Star, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { AdminRoleHeader, AdminRoleShell } from "@/components/AdminRoleLayout";
import type { Review } from "@/lib/types";

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

export default function ModerationAdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [moderatedCount, setModeratedCount] = useState(0);

  const reviewsQuery = useApiQuery<Review[]>("/api/admin/reviews", ["admin", "reviews", "moderation"], {
    enabled: isAuthenticated,
  });

  const moderateMutation = useApiMutation<unknown, { id: number; verified: boolean }>(
    ({ id }) => `/api/admin/reviews/${id}/moderate`,
    "post",
  );

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "content_admin")) {
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

  const reviews = reviewsQuery.data ?? [];
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <AdminRoleShell homePath="/admin/moderation">
      <AdminRoleHeader
        eyebrow="Moderation Admin"
        title="Content & Review Moderation"
        subtitle="Approve and moderate user-generated reviews."
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <section className="rounded-lg border border-white/10 border-l-2 border-l-ebs-warning bg-ebs-bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-warning">Flagged reviews</p>
              <Flag className="h-5 w-5 text-ebs-warning" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ebs-text">{reviews.length}</p>
            <p className="mt-1 text-xs text-ebs-text-muted">Awaiting moderation</p>
          </section>

          <section className="rounded-lg border border-white/10 border-l-2 border-l-ebs-gold bg-ebs-bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-gold">Avg rating</p>
              <Star className="h-5 w-5 text-ebs-gold" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ebs-text">{averageRating}</p>
            <p className="mt-1 text-xs text-ebs-text-muted">Across flagged reviews</p>
          </section>

          <section className="rounded-lg border border-white/10 border-l-2 border-l-ebs-teal bg-ebs-bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ebs-teal">Moderated</p>
              <ShieldCheck className="h-5 w-5 text-ebs-teal" strokeWidth={1.75} />
            </div>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ebs-text">{moderatedCount}</p>
            <p className="mt-1 text-xs text-ebs-text-muted">Approved this session</p>
          </section>
        </div>

        <div className="mt-6">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ebs-text-muted">Moderation queue</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ebs-text">
              Reviews pending approval
            </h2>
          </div>

          {reviewsQuery.isLoading ? (
            <Panel>
              <p className="py-10 text-center text-sm text-ebs-text-muted">Loading reviews...</p>
            </Panel>
          ) : reviews.length === 0 ? (
            <Panel>
              <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-ebs-success" strokeWidth={1.75} />
                <p className="font-display text-lg font-medium text-ebs-text">Queue clear</p>
                <p className="text-sm text-ebs-text-muted">No reviews are waiting for moderation.</p>
              </div>
            </Panel>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {reviews.map((review) => {
                const processing =
                  moderateMutation.isPending && moderateMutation.variables?.id === review.id;
                return (
                  <div key={review.id} className="rounded-lg border border-white/10 bg-ebs-bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 fill-ebs-gold text-ebs-gold" />
                          <span className="font-mono text-sm font-semibold tabular-nums text-ebs-text">
                            {Number(review.rating ?? 0).toFixed(1)}
                          </span>
                          <span className="ml-2 text-xs capitalize text-ebs-text-muted">
                            {review.targetType ?? "review"} #{review.targetId ?? "—"}
                          </span>
                        </div>
                        {review.title && (
                          <p className="mt-2 font-display text-base font-semibold text-ebs-text">{review.title}</p>
                        )}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-ebs-warning/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-ebs-warning">
                        <Flag className="h-3 w-3" /> Flagged
                      </span>
                    </div>

                    {review.body && (
                      <p className="mt-2 line-clamp-3 text-sm leading-5 text-ebs-text-secondary">{review.body}</p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-ebs-text-muted">{formatDate(review.createdAt)}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-2.5 border-t border-white/[0.06] pt-4">
                      <button
                        onClick={() => {
                          moderateMutation.mutate({ id: review.id, verified: true });
                          setModeratedCount((count) => count + 1);
                        }}
                        disabled={processing}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-ebs-success/40 bg-ebs-success/10 px-4 py-2 text-sm font-semibold text-ebs-success transition hover:bg-ebs-success/20 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                        {processing ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => moderateMutation.mutate({ id: review.id, verified: false })}
                        disabled={processing}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-ebs-error/40 bg-ebs-error/10 px-4 py-2 text-sm font-semibold text-ebs-error transition hover:bg-ebs-error/20 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" strokeWidth={2.5} />
                        Remove
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
          Reviews that are removed are hidden from the public platform immediately.
        </div>
      </main>
    </AdminRoleShell>
  );
}