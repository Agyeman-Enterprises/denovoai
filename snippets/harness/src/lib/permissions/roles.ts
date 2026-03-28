export type Role = "user" | "moderator" | "admin" | "banned";
export type TeamRole = "owner" | "admin" | "member" | "viewer";

export const ROLE_HIERARCHY: Record<Role, number> = { banned: -1, user: 0, moderator: 1, admin: 2 };

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function isBanned(role: Role): boolean { return role === "banned"; }
export function canModerate(role: Role): boolean { return hasRole(role, "moderator"); }
export function isAdmin(role: Role): boolean { return hasRole(role, "admin"); }

export function isOwner(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId;
}

export function canEditResource(resourceUserId: string, currentUserId: string, currentRole: Role): boolean {
  return isOwner(resourceUserId, currentUserId) || isAdmin(currentRole);
}

export function canDeleteResource(resourceUserId: string, currentUserId: string, currentRole: Role): boolean {
  return isOwner(resourceUserId, currentUserId) || isAdmin(currentRole);
}
