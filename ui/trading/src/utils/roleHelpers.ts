import { UserRole, type User } from '../types/user';

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null | undefined, role: UserRole): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null | undefined, roles: UserRole[]): boolean => {
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (user: User | null | undefined, roles: UserRole[]): boolean => {
  if (!user || !user.roles) return false;
  return roles.every(role => user.roles.includes(role));
};

/**
 * Get user's primary role (first role in array)
 */
export const getPrimaryRole = (user: User | null | undefined): UserRole | null => {
  if (!user || !user.roles || user.roles.length === 0) return null;
  return user.roles[0];
};

/**
 * Get user's display name (displayName, username, or email)
 */
export const getUserDisplayName = (user: User | null | undefined): string => {
  if (!user) return 'Unknown';
  return user.displayName || user.username || user.email || 'Unknown';
};

/**
 * Check if user is admin (has ADMIN or SUPER_ADMIN role)
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  return hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user: User | null | undefined): boolean => {
  return hasRole(user, UserRole.SUPER_ADMIN);
};
