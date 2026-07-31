import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/hooks/useApi";
import type { Salon } from "@/lib/types";
import {
  Star,
  MapPin,
  ShieldCheck,
  Clock,
  Search,
  Users,
  ChevronRight,
  Phone,
  CalendarDays,
  X,
} from "lucide-react";

export default function Salons() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  const { data: salonsData, isLoading } = useApiQuery<Salon[]>(
    "/api/shop/salons",
    ["shop", "salons"],
  );

  const salonList = useMemo(() => {
    return (salonsData ?? []).map((salon) => {
      const specialties: string[] = [];

      return {
        ...salon,
        name: salon.businessName,
        address: salon.address ?? "",
        image: salon.coverPhoto || salon.logoUrl || "/salon-placeholder.jpg",
        rating: Number(salon.averageRating ?? 0),
        reviews: salon.totalReviews ?? 0,
        specialties,
        isOpen: Boolean(salon.isActive),
      };
    });
  }, [salonsData]);

  const cities = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          salonList
            .map((s) => s.city)
            .filter((city): city is string => Boolean(city)),
        ),
      ),
    ],
    [salonList],
  );
  const allSpecialties = useMemo(
    () => Array.from(new Set(salonList.flatMap((s) => s.specialties ?? []))),
    [salonList],
  );

  const filtered = salonList.filter((salon) => {
    const matchesSearch =
      !searchQuery ||
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "all" || salon.city === selectedCity;
    const matchesSpecialty =
      selectedSpecialty === "all" || salon.specialties.includes(selectedSpecialty);
    return matchesSearch && matchesCity && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-ebs-bg pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm font-semibold text-ebs-teal tracking-widest uppercase mb-2">
            Discover
          </p>
          <h1 className="font-display text-ebs-text mb-4">
            Verified <span className="text-ebs-teal">Salons</span>
          </h1>
          <p className="text-ebs-text-secondary max-w-xl">
            Book appointments with KYC-verified stylists and salons near you.
            Real-time availability, transparent pricing, and secure payments.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ebs-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search salons by name or location..."
            className="pl-10 bg-ebs-bg-card border-white/10 text-ebs-text placeholder:text-ebs-text-muted focus:border-ebs-teal/50 h-11"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ebs-text-muted hover:text-ebs-text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-sm text-ebs-text-muted py-2">City:</span>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCity === city
                  ? "bg-ebs-teal text-white"
                  : "bg-ebs-bg-card text-ebs-text-secondary border border-white/10 hover:border-ebs-teal/30"
              }`}
            >
              {city === "all" ? "All Cities" : city}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <span className="text-sm text-ebs-text-muted py-2">Specialty:</span>
          <button
            onClick={() => setSelectedSpecialty("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedSpecialty === "all"
                ? "bg-ebs-gold text-ebs-bg"
                : "bg-ebs-bg-card text-ebs-text-secondary border border-white/10 hover:border-ebs-gold/30"
            }`}
          >
            All
          </button>
          {allSpecialties.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSpecialty(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedSpecialty === s
                  ? "bg-ebs-gold text-ebs-bg"
                  : "bg-ebs-bg-card text-ebs-text-secondary border border-white/10 hover:border-ebs-gold/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Salon Cards */}
        {filtered.length > 0 ? (
          <div className="space-y-6">
            {filtered.map((salon) => (
              <div
                key={salon.id}
                className="rounded-2xl bg-ebs-bg-card border border-white/5 overflow-hidden hover:border-ebs-teal/20 transition-all duration-300"
              >
                <div className="grid md:grid-cols-[300px_1fr]">
                  <img
                    src={salon.image}
                    alt={salon.name}
                    className="w-full h-64 md:h-full object-cover"
                  />
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-display text-2xl text-ebs-text">
                            {salon.name}
                          </h3>
                          {salon.isVerified && (
                            <ShieldCheck className="h-5 w-5 text-ebs-teal" />
                          )}
                        </div>
                        <p className="text-sm text-ebs-text-muted flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {salon.address}, {salon.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-ebs-bg px-3 py-1.5 rounded-lg">
                        <Star className="h-4 w-4 text-ebs-gold fill-ebs-gold" />
                        <span className="text-sm font-semibold text-ebs-text">
                          {salon.rating}
                        </span>
                        <span className="text-xs text-ebs-text-muted">
                          ({salon.reviews})
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-ebs-text-secondary mb-4 line-clamp-2">
                      {salon.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {salon.specialties.map((s: string) => (
                        <span
                          key={s}
                          className="px-3 py-1 rounded-full bg-ebs-bg text-xs text-ebs-text-secondary border border-white/5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                      <span
                        className={`flex items-center gap-1 ${
                          salon.isOpen ? "text-ebs-success" : "text-ebs-error"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {salon.isOpen ? "Open Now" : "Closed"}
                      </span>
                      <span className="flex items-center gap-1 text-ebs-text-muted">
                        <Users className="h-3.5 w-3.5" />
                        {salon.seatCapacity} seats
                      </span>
                      <span className="flex items-center gap-1 text-ebs-text-muted">
                        <span className="h-2 w-2 rounded-full bg-ebs-teal" />
                        {salon.busyPercentage}% occupancy
                      </span>
                      {salon.phoneNumber && (
                        <span className="flex items-center gap-1 text-ebs-text-muted">
                          <Phone className="h-3.5 w-3.5" />
                          {salon.phoneNumber}
                        </span>
                      )}
                    </div>

                    {/* Services preview */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-ebs-text-muted uppercase tracking-wider mb-3">
                        Services
                      </p>
                      <div className="text-sm text-ebs-text-secondary">
                        Service data will be available once the salon details are loaded.
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button className="bg-ebs-teal hover:bg-ebs-teal-light text-white font-semibold">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                      <Button
                        variant="outline"
                        className="border-ebs-teal/30 text-ebs-teal hover:bg-ebs-teal/10"
                      >
                        View Profile
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isLoading ? (
          <div className="text-center py-20">
            <p className="text-lg text-ebs-text">Loading salons...</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-ebs-text-muted mx-auto mb-4" />
            <h3 className="font-display text-xl text-ebs-text mb-2">
              No salons found
            </h3>
            <p className="text-sm text-ebs-text-muted">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
