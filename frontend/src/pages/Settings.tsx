import { Link } from "react-router";

export default function Settings() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-ebs-bg-card p-10 shadow-lg shadow-ebs-gold/5">
        <h1 className="text-3xl font-semibold tracking-tight text-ebs-text">
          Settings
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-ebs-text-muted">
          Update your account settings, notification preferences, and privacy controls.
        </p>
        <div className="mt-8 space-y-4 text-sm text-ebs-text-secondary">
          <p>This page is a placeholder until settings are available in the dashboard.</p>
          <p>Meanwhile, you can use the account dropdown to navigate to your dashboard or KYC status.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center rounded-full bg-ebs-gold px-5 py-3 text-sm font-semibold text-ebs-bg transition hover:bg-ebs-gold-light"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
