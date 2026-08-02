import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Scissors,
  Users,
  Star,
  ArrowRight,
  MapPin,
  Award,
  Leaf,
} from "lucide-react";

const values = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Certified Expertise",
    description:
      "Every stylist and salon on our platform is KYC-verified with professional credentials checked before they can take a booking.",
  },
  {
    icon: <HeartHandshake className="h-6 w-6" />,
    title: "Personalised Service",
    description:
      "From your first consultation to your final styling, we tailor every experience to your unique hair, features, and preferences.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI-Powered Style",
    description:
      "Use our AI try-on to preview hundreds of hairstyles on your own face before you commit, so you always walk in confident.",
  },
  {
    icon: <Leaf className="h-6 w-6" />,
    title: "Premium Products",
    description:
      "Our curated shop carries only professional-grade hair care, from growth serums to styling essentials, chosen with care.",
  },
];

const stats = [
  { value: "5,000+", label: "Happy Clients", icon: <Users className="h-6 w-6" /> },
  { value: "300+", label: "Verified Stylists", icon: <Award className="h-6 w-6" /> },
  { value: "4.9/5", label: "Average Rating", icon: <Star className="h-6 w-6" /> },
  { value: "50+", label: "Partner Salons", icon: <Scissors className="h-6 w-6" /> },
];

export default function About() {
  return (
    <div className="min-h-screen bg-ebs-bg pt-24">
      {/* Header */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-ebs-gold/5 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <p className="text-sm font-semibold text-ebs-gold tracking-widest uppercase mb-3">
            About Us
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-ebs-text mb-6 max-w-3xl">
            Our Story, Our <span className="text-gradient-gold">Passion</span>
          </h1>
          <p className="text-ebs-text-secondary max-w-2xl leading-relaxed">
            Early Bright is a modern boutique hair salon platform connecting you
            with verified stylists, premium products, and AI-powered hairstyle
            try-ons — all in one place.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-20 bg-ebs-bg-card/40 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-5 text-ebs-text-secondary leading-relaxed">
              <h2 className="font-display text-3xl md:text-4xl text-ebs-text font-light">
                Welcome to{" "}
                <span className="font-semibold text-gradient-gold">EARLY BRIGHT</span>
              </h2>
              <p>
                Early Bright is a modern boutique hair salon. We specialise in all
                hair types and ethnicities including European hair, Asian hair,
                Afro hair and more. We offer various luxury extension methods
                including tape-ins, microlinks and LA Weave.
              </p>
              <p>
                It is our priority that our clients receive a personalised service
                and impeccable results at our salon. Our philosophy derives from the
                understanding that customer service comes first and we are proud to
                bring that experience to you in our salon.
              </p>
              <p>
                Beyond the salon floor, we've built a community — an app that pairs
                you with verified stylists, lets you shop professional-grade hair
                care, check live salon occupancy, and even try on hairstyles with AI
                before you book.
              </p>
              <p className="font-medium text-ebs-text">We hope to see you soon!</p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-dark-lg">
                <img
                  src="/salon-interior.jpg"
                  alt="Early Bright salon interior"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-ebs-gold/10 flex items-center justify-center text-ebs-gold shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <p className="font-display text-3xl md:text-4xl text-ebs-text font-semibold leading-none">
                    {stat.value}
                  </p>
                  <p className="text-sm text-ebs-text-muted mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-ebs-gold tracking-widest uppercase mb-3">
              What We Stand For
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-ebs-text">
              Our <span className="text-gradient-gold">Values</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="p-6 rounded-2xl bg-ebs-bg-card border border-white/5 hover:border-ebs-gold/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-xl bg-ebs-gold/10 flex items-center justify-center text-ebs-gold mb-4">
                  {value.icon}
                </div>
                <h3 className="font-display text-lg text-ebs-text mb-2">{value.title}</h3>
                <p className="text-sm text-ebs-text-secondary leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit / CTA */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-ebs-gold/10 via-ebs-bg to-ebs-teal/10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ebs-teal/10 border border-ebs-teal/20">
                <MapPin className="h-4 w-4 text-ebs-teal" />
                <span className="text-sm font-medium text-ebs-teal">Visit Us</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ebs-text">
                Find Your <span className="text-ebs-teal">Perfect Style</span>
              </h2>
              <p className="text-ebs-text-secondary leading-relaxed max-w-md">
                Browse verified salons near you, explore trending hairstyles, or
                shop our premium collection. Your hair journey starts here.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/salons">
                  <Button className="h-12 px-6 bg-ebs-teal hover:bg-ebs-teal-light text-white font-semibold rounded-xl">
                    Find a Salon
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button className="h-12 px-6 bg-ebs-gold text-ebs-bg font-bold hover:bg-ebs-gold-light rounded-xl">
                    Shop Products
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] max-w-md mx-auto rounded-2xl overflow-hidden shadow-dark-lg">
                <img
                  src="/hero-model.jpg"
                  alt="Early Bright model"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
