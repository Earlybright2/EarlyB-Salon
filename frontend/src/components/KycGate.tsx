import { useNavigate } from "react-router";
import { CheckCircle2, Clock, Home, ShieldCheck, XCircle } from "lucide-react";

export default function KycGate({ status }: { status?: string }) {
  const navigate = useNavigate();

  const isPending = status === "pending" || status === "under_review";
  const isRejected = status === "rejected";
  const isSubmitted = status === "not_submitted";

  const title = isRejected
    ? "Your KYC was not approved"
    : isPending
      ? "Verification in review"
      : "Unlock your dashboard";

  const message = isRejected
    ? "Your verification documents were rejected. Please resubmit your documents for another review by the Early Bright team."
    : isPending
      ? "An admin is reviewing your documents. You'll get access to your dashboard as soon as your KYC is approved."
      : "Complete your KYC verification to unlock your dashboard and start serving clients.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ebs-bg px-6 py-12">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(50% 40% at 50% 0%, rgba(212,175,55,0.12), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-ebs-bg-card/80 p-8 text-center shadow-[0_32px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-10">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-ebs-gold/10">
          {isRejected ? (
            <XCircle className="h-8 w-8 text-ebs-error" />
          ) : isPending ? (
            <Clock className="h-8 w-8 text-ebs-warning" />
          ) : (
            <ShieldCheck className="h-8 w-8 text-ebs-gold" />
          )}
        </div>

        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ebs-text">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ebs-text-muted">{message}</p>

        <div
          className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] ${
            isRejected
              ? "border-ebs-error/30 bg-ebs-error/10 text-ebs-error"
              : isPending
                ? "border-ebs-warning/30 bg-ebs-warning/10 text-ebs-warning"
                : "border-ebs-gold/30 bg-ebs-gold/10 text-ebs-gold"
          }`}
        >
          {status ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : null}
          KYC {status ?? "required"}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {isSubmitted || isRejected ? (
            <button
              onClick={() => navigate("/auth/kyc")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-ebs-gold to-ebs-gold-light px-5 py-3.5 text-sm font-bold text-ebs-bg shadow-gold transition hover:brightness-110"
            >
              <ShieldCheck className="h-4 w-4" />
              {isRejected ? "Resubmit documents" : "Complete KYC"}
            </button>
          ) : null}
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-ebs-text-secondary transition hover:text-ebs-text"
          >
            <Home className="h-4 w-4" />
            Back to site
          </button>
        </div>
      </div>
    </div>
  );
}
