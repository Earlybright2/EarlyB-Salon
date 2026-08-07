import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  FileCheck2,
  IdCard,
  ImagePlus,
  Loader2,
  Receipt,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useApiQuery } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type KycData = {
  kycStatus: string;
  kycSubmittedAt?: string | null;
  kycApprovedAt?: string | null;
};

const UPLOAD_FIELDS: {
  key: "government_id" | "business_certificate" | "utility_bill" | "salon_photo";
  label: string;
  hint: string;
  icon: typeof IdCard;
  accept: string;
}[] = [
  {
    key: "government_id",
    label: "Government ID",
    hint: "National ID, driver's license or passport",
    icon: IdCard,
    accept: "image/*,application/pdf",
  },
  {
    key: "business_certificate",
    label: "Business Certificate",
    hint: "CAC or business registration certificate",
    icon: FileCheck2,
    accept: "image/*,application/pdf",
  },
  {
    key: "utility_bill",
    label: "Utility Bill",
    hint: "Recent electricity or water bill",
    icon: Receipt,
    accept: "image/*,application/pdf",
  },
  {
    key: "salon_photo",
    label: "Salon Photo",
    hint: "A clear photo of your salon",
    icon: Camera,
    accept: "image/*",
  },
];

function UploadCard({
  field,
  file,
  onSelect,
}: {
  field: (typeof UPLOAD_FIELDS)[number];
  file: File | null;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = field.icon;

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-ebs-border bg-ebs-elevated/60 p-5 transition-colors hover:border-ebs-gold/40"
    >
      <input
        ref={inputRef}
        type="file"
        accept={field.accept}
        className="hidden"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
      />
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ebs-gold/10 text-ebs-gold">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ebs-text">{field.label}</p>
          <p className="mt-0.5 text-xs text-ebs-text-muted">{field.hint}</p>
        </div>
        {file ? (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="rounded-full p-1 text-ebs-text-muted transition-colors hover:text-ebs-error"
            aria-label={`Remove ${field.label}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {file ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-ebs-success/20 bg-ebs-success/10 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-ebs-success" />
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-ebs-text">{file.name}</p>
          <p className="shrink-0 text-[10px] uppercase tracking-wider text-ebs-success">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ebs-border py-2.5 text-xs font-medium text-ebs-text-muted transition-colors group-hover:border-ebs-gold/40 group-hover:text-ebs-gold"
        >
          <ImagePlus className="h-4 w-4" />
          Choose file
        </button>
      )}
    </div>
  );
}

function StatusBanner({ icon, title, message, tone }: {
  icon: ReactNode;
  title: string;
  message: string;
  tone: "pending" | "approved" | "rejected";
}) {
  const tones = {
    pending: "border-ebs-gold/25 bg-ebs-gold/10 text-ebs-gold",
    approved: "border-ebs-success/25 bg-ebs-success/10 text-ebs-success",
    rejected: "border-ebs-error/25 bg-ebs-error/10 text-ebs-error",
  };
  return (
    <div className={cn("flex items-start gap-4 rounded-2xl border p-5", tones[tone])}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="font-semibold text-ebs-text">{title}</p>
        <p className="mt-1 text-sm text-ebs-text-muted">{message}</p>
      </div>
    </div>
  );
}

export default function Kyc() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, refetch } = useApiQuery<KycData>(
    "/api/auth/kyc",
    ["auth", "kyc"],
    { retry: false },
  );

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/auth/login");
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    const missing = UPLOAD_FIELDS.filter((field) => !files[field.key]);
    if (missing.length) {
      setError(`Please upload ${missing.map((field) => field.label).join(", ")}.`);
      return;
    }

    const formData = new FormData();
    UPLOAD_FIELDS.forEach((field) => {
      formData.append(field.key, files[field.key] as File);
    });

    setSubmitting(true);
    try {
      await api.post("/api/auth/kyc", formData);
      setSuccess(
        "Your KYC has been submitted and is being reviewed. If approved, a link to your dashboard will be sent to your email.",
      );
      refetch();
    } catch (err) {
      setError((err as Error).message || "Failed to submit KYC. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  const kycStatus = data?.kycStatus;
  const isPending = kycStatus === "pending" || kycStatus === "under_review";
  const isApproved = kycStatus === "approved";
  const isRejected = kycStatus === "rejected";
  const showForm = !data || (!isPending && !isApproved && !isRejected) || isRejected;

  const allUploaded = UPLOAD_FIELDS.every((field) => files[field.key]);

  return (
    <div className="min-h-screen bg-ebs-bg px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ebs-gold">
            KYC Verification
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ebs-text sm:text-4xl">
            Verify your business and get discovered
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-ebs-text-muted">
            Upload your documents below. Your information is encrypted, stored securely, and only used
            to verify your professional status.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center rounded-3xl border border-ebs-border bg-ebs-card">
                <Loader2 className="h-6 w-6 animate-spin text-ebs-gold" />
              </div>
            ) : (
              <>
                {isPending ? (
                  <StatusBanner
                    icon={<Clock3 className="h-5 w-5" />}
                    tone="pending"
                    title="Your KYC is currently being reviewed."
                    message="You will receive an email from us within 24 hours once the review is complete. If approved, a link to your dashboard will be sent to your email."
                  />
                ) : null}

                {isPending ? (
                  <Button
                    onClick={() => navigate("/")}
                    className="w-full border border-ebs-border bg-ebs-elevated text-ebs-text hover:border-ebs-gold/40 hover:text-ebs-gold"
                    size="lg"
                  >
                    Back to home
                  </Button>
                ) : null}

                {isApproved ? (
                  <StatusBanner
                    icon={<ShieldCheck className="h-5 w-5" />}
                    tone="approved"
                    title="KYC approved!"
                    message="Your business is now verified. Head over to your dashboard to get started."
                  />
                ) : null}

                {isRejected ? (
                  <StatusBanner
                    icon={<AlertTriangle className="h-5 w-5" />}
                    tone="rejected"
                    title="Your KYC was not approved."
                    message="Please review the documents below and re-submit for verification."
                  />
                ) : null}

                {isApproved ? (
                  <Button
                    onClick={() =>
                      navigate(
                        (user.role as string) === "barber" ? "/barber/dashboard" : "/stylist/dashboard",
                      )
                    }
                    className="w-full bg-ebs-gold text-black hover:bg-ebs-gold-dark"
                    size="lg"
                  >
                    Go to dashboard
                  </Button>
                ) : null}

                {showForm ? (
                  <div className="rounded-3xl border border-ebs-border bg-ebs-card p-5 sm:p-8">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-ebs-text">Upload your documents</h2>
                        <p className="mt-1 text-sm text-ebs-text-muted">
                          {isRejected
                            ? "Replace the documents that were rejected."
                            : "All four documents are required."}
                        </p>
                      </div>
                      <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-ebs-border bg-ebs-elevated px-3 py-1 text-xs text-ebs-text-muted sm:inline-flex">
                        <ShieldCheck className="h-3.5 w-3.5 text-ebs-gold" />
                        Secure upload
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {UPLOAD_FIELDS.map((field) => (
                        <UploadCard
                          key={field.key}
                          field={field}
                          file={files[field.key] ?? null}
                          onSelect={(file) =>
                            setFiles((current) => ({ ...current, [field.key]: file }))
                          }
                        />
                      ))}
                    </div>

                    {success ? (
                      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ebs-success/25 bg-ebs-success/10 p-4 text-sm text-ebs-text">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ebs-success" />
                        {success}
                      </div>
                    ) : null}

                    {error ? (
                      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ebs-error/25 bg-ebs-error/10 p-4 text-sm text-ebs-text">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ebs-error" />
                        {error}
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      className="mt-6 w-full bg-ebs-gold text-black hover:bg-ebs-gold-dark"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading documents...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          {allUploaded ? "Submit KYC" : "Submit KYC"}
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-ebs-gold/15 bg-ebs-card p-6">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-ebs-gold/10 px-3.5 py-1.5 text-xs font-medium text-ebs-gold">
                <UploadCloud className="h-3.5 w-3.5" />
                Why this matters
              </div>
              <ul className="space-y-4 text-sm text-ebs-text-muted">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ebs-gold" />
                  Credentials help us verify your business and connect you with clients faster.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ebs-gold" />
                  Approved KYC gives you better visibility in barber and stylist searches.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ebs-gold" />
                  Your documents stay private and are never shared without your permission.
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-ebs-warning/20 bg-ebs-warning/10 p-4 text-sm text-ebs-text-muted">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ebs-warning" />
              <span>Once submitted, review usually takes less than 24 hours.</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
