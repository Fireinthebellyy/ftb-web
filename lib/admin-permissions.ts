export const userRoles = ["user", "member", "editor", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

export const adminTabValues = [
  "opportunities",
  "OpportunityManagement",
  "internships",
  "users",
  "toolkits",
  "coupons",
  "ungatekeep",
] as const;

export type AdminTabValue = (typeof adminTabValues)[number];

const roleToAdminTabs: Record<UserRole, readonly AdminTabValue[]> = {
  user: [],
  member: [],
  editor: [
    "opportunities",
    "OpportunityManagement",
    "internships",
    "toolkits",
    "ungatekeep",
  ],
  admin: adminTabValues,
};

export function isUserRole(
  value: string | null | undefined
): value is UserRole {
  return Boolean(value) && userRoles.includes(value as UserRole);
}

export function isAdminTab(value: string | null): value is AdminTabValue {
  return value !== null && adminTabValues.includes(value as AdminTabValue);
}

export function getAllowedAdminTabs(
  role: string | null | undefined
): readonly AdminTabValue[] {
  if (!isUserRole(role)) {
    return [];
  }

  return roleToAdminTabs[role];
}

export function canAccessAdminPanel(role: string | null | undefined): boolean {
  return getAllowedAdminTabs(role).length > 0;
}

export function canAccessAdminTab(
  role: string | null | undefined,
  tab: AdminTabValue
): boolean {
  return getAllowedAdminTabs(role).includes(tab);
}
