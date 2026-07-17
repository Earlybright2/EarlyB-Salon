import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import {
  TrendingUp,
  Camera,
  ChevronRight,
  Star,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const norwoodScale = [
  { stage: "I", label: "Minimal", desc: "No visible hair loss" },
  { stage: "II", label: "Mild", desc: "Slight recession" },
  { stage: "IIA", label: "Mild+", desc: "Frontal recession" },
  { stage: "III", label: "Moderate", desc: "Deep recession" },
  { stage: "IV", label: "Advanced", desc: "Visible crown loss" },
  { stage: "V", label: "Severe", desc: "Large bald area" },
  { stage: "VI", label: "Very Severe", desc: "Extensive loss" },
  { stage: "VII", label: "Complete", desc: "Most hair lost" },
];

const treatments = [
  {
    id: 1,
    name: "Scalp Micropigmentation",
    description: "Non-surgical procedure that creates the illusion of fuller hair using detailed micro-needles to deposit pigment into the scalp.",
    duration: "2-3 sessions",
    price: "from ₦150,000",
    icon: "Sparkles",
  },
  {
    id: 2,
    name: "PRP Therapy",
    description: "Platelet-Rich Plasma treatment uses your own blood platelets to stimulate hair growth and strengthen follicles.",
    duration: "4-6 sessions",
    price: "from ₦80,000/session",
    icon: "TrendingUp",
  },
  {
    id: 3,
    name: "Hair Transplant Referral",
    description: "Connect with certified surgeons for FUE or FUT transplant procedures with the highest success rates.",
    duration: "1 day procedure",
    price: "from ₦500,000",
    icon: "ShieldCheck",
  },
];

const recommendedProducts = [
  { id: 1, name: "Aurora Hair Elixir Serum", price: 12500, image: "/product-serum.jpg" },
  { id: 6, name: "Argan Elixir Hair Oil", price: 11000, image: "/product-oil.jpg" },
  { id: 9, name: "Opulence Edge Control Gel", price: 5500, image: "/product-edge-control.jpg" },
];

export default function Restore() {
  const [selectedStage, setSelectedStage] = useState("IV");
  const [showAssessment, setShowAssessment] = useState(false);

  return (
    <div className="min-h-screen bg-ebs-bg pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ebs-teal/10 border border-ebs-teal/20 mb-4">
            <TrendingUp className="h-4 w-4 text-ebs-teal" />
            <span className="text-sm font-medium text-ebs-teal">
              Hairline Restoration
            </span>
          </div>
          <h1 className="font-display text-ebs-text mb-4">
            Reclaim Your <span className="text-ebs-teal">Hairline</span>
          </h1>
          <p className="text-ebs-text-secondary max-w-2xl mx-auto">
            Take control of your hairline with our comprehensive restoration
            program. Get a personalized assessment, connect with certified
            specialists, and track your progress over time.
          </p>
        </div>

        {/* Before/After */}
        <div className="rounded-2xl overflow-hidden mb-16">
          <img
            src="/hairline-before-after.jpg"
            alt="Hairline restoration results"
            className="w-full h-auto"
          />
        </div>

        {/* Assessment CTA */}
        {!showAssessment ? (
          <div className="rounded-2xl bg-gradient-to-r from-ebs-teal/10 to-ebs-bg-card border border-ebs-teal/20 p-8 md:p-12 text-center mb-16">
            <div className="h-16 w-16 rounded-full bg-ebs-teal/20 flex items-center justify-center mx-auto mb-6">
              <Camera className="h-8 w-8 text-ebs-teal" />
            </div>
            <h2 className="font-display text-2xl text-ebs-text mb-3">
              Get Your Personalized Restoration Plan
            </h2>
            <p className="text-ebs-text-secondary mb-8 max-w-md mx-auto">
              Take a quick hairline assessment and receive a customized treatment
              plan tailored to your needs.
            </p>
            <Button
              onClick={() => setShowAssessment(true)}
              className="h-14 px-8 bg-ebs-teal hover:bg-ebs-teal-light text-white font-bold text-base"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Start Assessment
            </Button>
          </div>
        ) : (
          <div className="mb-16 space-y-8">
            {/* Norwood Scale */}
            <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6 md:p-8">
              <h3 className="font-display text-xl text-ebs-text mb-2">
                Select Your Hairline Stage
              </h3>
              <p className="text-sm text-ebs-text-muted mb-6">
                Use the Norwood scale to identify your current hair loss pattern.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {norwoodScale.map((stage) => (
                  <button
                    key={stage.stage}
                    onClick={() => setSelectedStage(stage.stage)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      selectedStage === stage.stage
                        ? "bg-ebs-teal text-white shadow-teal"
                        : "bg-ebs-bg text-ebs-text-secondary border border-white/5 hover:border-ebs-teal/30"
                    }`}
                  >
                    <div className="text-lg">{stage.stage}</div>
                    <div className="text-[10px] opacity-70">{stage.label}</div>
                  </button>
                ))}
              </div>

              {selectedStage && (
                <div className="p-4 rounded-xl bg-ebs-bg border border-ebs-teal/20">
                  <p className="text-sm text-ebs-text mb-1">
                    Stage {selectedStage} selected —{" "}
                    <span className="text-ebs-teal font-medium">
                      {norwoodScale.find((s) => s.stage === selectedStage)?.desc}
                    </span>
                  </p>
                  <p className="text-xs text-ebs-text-muted">
                    Our AI recommends starting treatment as early as possible for
                    best results.
                  </p>
                </div>
              )}
            </div>

            {/* Personalized Plan */}
            <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6 md:p-8">
              <h3 className="font-display text-xl text-ebs-text mb-6">
                Your Personalized Restoration Plan
              </h3>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {treatments.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 rounded-xl bg-ebs-bg border border-white/5 hover:border-ebs-teal/20 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-ebs-teal/10 flex items-center justify-center text-ebs-teal">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-ebs-text">
                          {t.name}
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-ebs-text-secondary mb-3 leading-relaxed">
                      {t.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-ebs-text-muted">
                        <Clock className="h-3 w-3" />
                        {t.duration}
                      </div>
                      <span className="text-sm font-semibold text-ebs-teal">
                        {t.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Products */}
              <h4 className="text-sm font-semibold text-ebs-text mb-4">
                Recommended Products for Your Stage
              </h4>
              <div className="flex flex-wrap gap-4">
                {recommendedProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/shop/${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-ebs-bg border border-white/5 hover:border-ebs-gold/30 transition-all"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-ebs-text">
                        {p.name}
                      </p>
                      <p className="text-sm text-ebs-gold">
                        ₦{p.price.toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ebs-text-muted ml-2" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Progress Tracker Preview */}
            <div className="rounded-2xl bg-ebs-bg-card border border-white/5 p-6 md:p-8">
              <h3 className="font-display text-xl text-ebs-text mb-4">
                Progress Tracker
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-20 w-20 rounded-xl bg-ebs-bg flex items-center justify-center border border-white/5">
                  <Camera className="h-8 w-8 text-ebs-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-ebs-text">Month 1</span>
                    <span className="text-sm text-ebs-teal font-medium">
                      Starting Point
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ebs-bg overflow-hidden">
                    <div className="h-full w-[16%] rounded-full bg-ebs-teal" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-ebs-text-muted">
                <span>Month 1</span>
                <span>Month 2</span>
                <span>Month 3</span>
                <span>Month 4</span>
                <span>Month 5</span>
                <span>Month 6</span>
              </div>
              <p className="text-xs text-ebs-text-muted mt-4">
                Log your progress photos every 30 days to track your restoration
                journey.
              </p>
            </div>

            <div className="text-center">
              <Button className="h-14 px-8 bg-ebs-teal hover:bg-ebs-teal-light text-white font-bold text-base">
                <TrendingUp className="h-5 w-5 mr-2" />
                Start My Restoration Journey
              </Button>
            </div>
          </div>
        )}

        {/* Why Choose Us */}
        <div className="mb-16">
          <h2 className="font-display text-2xl text-ebs-text text-center mb-8">
            Why Trust <span className="text-ebs-teal">Early Bright</span> Restore
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                title: "Certified Specialists",
                desc: "All trichologists verified with professional credentials",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: "Proven Results",
                desc: "94% of clients see improvement within 3 months",
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: "Flexible Scheduling",
                desc: "Book appointments that fit your busy lifestyle",
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "4.9/5 Rating",
                desc: "From over 500 restoration clients",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-ebs-bg-card border border-white/5 text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-ebs-teal/10 flex items-center justify-center text-ebs-teal mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-ebs-text mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-ebs-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-ebs-teal/10 to-ebs-gold/10 border border-ebs-teal/20 p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl text-ebs-text mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-ebs-text-secondary mb-8 max-w-md mx-auto">
            Join thousands who have transformed their hairline with Early Bright.
            Your confidence awaits.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="h-14 px-8 bg-ebs-teal hover:bg-ebs-teal-light text-white font-bold">
              Book Consultation
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Link to="/shop">
              <Button
                variant="outline"
                className="h-14 px-8 border-ebs-gold/30 text-ebs-gold hover:bg-ebs-gold/10"
              >
                Shop Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
