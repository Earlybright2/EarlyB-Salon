import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays,
  ShieldCheck,
  Users,
  Wallet,
  Star,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import KycGate from "@/components/KycGate";
import { useAuth } from "@/hooks/useAuth";
import { useApiQuery } from "@/hooks/useApi";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof CalendarDays;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-ebs-text-muted">{label}</p>
        <div className={`h-10 w-10 rounded-xl ${accent} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-ebs-text">{value}</p>
      <p className="text-xs text-ebs-text-muted mt-1">{hint}</p>
    </div>
  );
}

export default function StylistDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const kycQuery = useApiQuery<{ kycStatus: string }>("/api/auth/kyc", ["auth", "kyc"], {
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ebs-bg flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ebs-gold border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const kycStatus = kycQuery.data?.kycStatus;
  if (!kycQuery.isLoading && (kycQuery.isError || (kycStatus && kycStatus !== "approved"))) {
    return <KycGate status={kycQuery.isError ? "not_submitted" : kycStatus} />;
  }

  if (kycQuery.isLoading) {
    return (
      <div className="min-h-screen bg-ebs-bg flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-ebs-gold border-t-transparent" />
      </div>
    );
  }

  const name = user?.name?.split(" ")[0] || "Stylist";

  return (
    <DashboardLayout
      title="Stylist Dashboard"
      subtitle={`Welcome back, ${name}. Manage your clients and visibility.`}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Clients" value="0" hint="New this month" icon={Users} accent="bg-ebs-rose/10 text-ebs-rose" />
            <StatCard label="Total Earnings" value="₦0" hint="All time revenue" icon={Wallet} accent="bg-ebs-gold/10 text-ebs-gold" />
            <StatCard label="KYC Status" value="Pending" hint="Verification in review" icon={ShieldCheck} accent="bg-ebs-warning/10 text-ebs-warning" />
            <StatCard label="Avg. Rating" value="—" hint="Based on reviews" icon={Star} accent="bg-ebs-teal/10 text-ebs-teal" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg text-ebs-text">Recent Activity</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ebs-teal/10 px-3 py-1 text-xs font-medium text-ebs-teal">
                  <TrendingUp className="h-3.5 w-3.5" /> Live
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-10 w-10 text-ebs-text-muted mb-4" />
                <p className="text-sm text-ebs-text-secondary">No activity yet</p>
                <p className="text-xs text-ebs-text-muted mt-1">
                  Your client interactions and bookings will appear here.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
              <h3 className="font-display text-lg text-ebs-text mb-4">Getting Started</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-ebs-gold/10 text-ebs-gold flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <p className="text-sm font-medium text-ebs-text">Complete your KYC</p>
                    <p className="text-xs text-ebs-text-muted mt-0.5">
                      Get verified to appear in stylist searches.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-ebs-gold/10 text-ebs-gold flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <p className="text-sm font-medium text-ebs-text">Showcase your work</p>
                    <p className="text-xs text-ebs-text-muted mt-0.5">
                      Add your portfolio and specialties.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-ebs-gold/10 text-ebs-gold flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <p className="text-sm font-medium text-ebs-text">Grow your clientele</p>
                    <p className="text-xs text-ebs-text-muted mt-0.5">
                      Consistent great service builds loyalty.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate("/auth/kyc")}
                className="mt-6 w-full bg-ebs-gold text-black hover:bg-ebs-gold-dark"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Complete KYC
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "appointments" ? (
        <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
          <h3 className="font-display text-lg text-ebs-text mb-6">Appointments</h3>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-10 w-10 text-ebs-text-muted mb-4" />
            <p className="text-sm text-ebs-text-secondary">No appointments yet</p>
            <p className="text-xs text-ebs-text-muted mt-1">
              Bookings you receive will show up here.
            </p>
          </div>
        </div>
      ) : null}

      {activeTab === "kyc" ? (
        <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6">
          <h3 className="font-display text-lg text-ebs-text mb-4">KYC Status</h3>
          <div className="rounded-xl border border-ebs-warning/25 bg-ebs-warning/10 p-5 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-ebs-warning mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ebs-text">Verification pending</p>
              <p className="text-sm text-ebs-text-muted mt-1">
                Submit your documents to get verified and become discoverable.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/auth/kyc")}
            className="mt-5 bg-ebs-gold text-black hover:bg-ebs-gold-dark"
          >
            Go to KYC <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
