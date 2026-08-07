export const LOGIN_PATH = "/auth/login";

export const ADMIN_ROLES = [
  "admin",
  "super_admin",
  "verification_admin",
  "finance_admin",
  "support_admin",
  "content_admin",
] as const;

export const ADMIN_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "verification_admin", label: "Verification Admin" },
  { value: "finance_admin", label: "Finance Admin" },
  { value: "support_admin", label: "Support Admin" },
  { value: "content_admin", label: "Moderation Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export function getAdminDashboardPath(role?: string | null): string {
  switch (role) {
    case "verification_admin":
      return "/admin/verification";
    case "finance_admin":
      return "/admin/finance";
    case "support_admin":
      return "/admin/support";
    case "content_admin":
      return "/admin/moderation";
    case "admin":
    case "super_admin":
    default:
      return "/admin";
  }
}