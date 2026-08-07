import { useNavigate } from "react-router";

function ClipperIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3v2" />
      <path d="M12 3v2" />
      <path d="M16 3v2" />
      <path d="M9 12v6a3 3 0 0 0 6 0v-6h-6" />
      <path d="M8 5h8l-1 4h-6l-1 -4" />
      <path d="M12 17v1" />
    </svg>
  );
}

function CombIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="8" width="11" height="4" rx="1" />
      <path d="M15 8.5h4a2 2 0 0 1 0 4h-4" />
      <path d="M6 12v3" />
      <path d="M8.5 12v4" />
      <path d="M11 12v4" />
      <path d="M13.5 12v3" />
    </svg>
  );
}

const options = [
  {
    key: "barber",
    title: "Barber",
    subtitle: "Styles and barbs hairs",
    icon: <ClipperIcon />,
  },
  {
    key: "stylist",
    title: "Stylist",
    subtitle: "Plants hair, attachments and braids",
    icon: <CombIcon />,
  },
];

export default function Signup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ebs-bg flex flex-col items-center justify-center px-4 py-16">
      {/* Logo top-left, like Upwork */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 text-xl font-display font-semibold text-ebs-text transition-colors hover:text-ebs-gold"
      >
        Early Bright
      </button>

      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-ebs-text mb-3">
          Welcome to Early Bright
        </h1>
        <p className="text-base text-ebs-text-muted mb-12">
          Which describes you best?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {options.map((option) => (
            <button
              key={option.key}
              onClick={() => navigate(`/auth/register?role=${option.key}`)}
              className="group flex flex-col items-center rounded-2xl border border-ebs-border bg-ebs-bg-card p-8 text-center transition hover:border-ebs-gold hover:-translate-y-0.5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ebs-gold/10 text-ebs-gold mb-6 transition group-hover:bg-ebs-gold/20">
                {option.icon}
              </div>
              <h2 className="text-lg font-semibold text-ebs-text">
                {option.title}
                <span className="inline-block ml-1 transition group-hover:translate-x-1">→</span>
              </h2>
              <p className="mt-2 text-sm text-ebs-text-muted">
                {option.subtitle}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-12 text-sm text-ebs-text-muted">
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-ebs-gold hover:text-ebs-gold-dark"
            onClick={() => navigate("/auth/login")}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}