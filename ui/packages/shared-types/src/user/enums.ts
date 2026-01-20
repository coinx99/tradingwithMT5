/**
 * User roles enum
 * Shared between backend and frontend
 */
export enum UserRole {
  USER = 'user',
  SELLER = 'seller',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * User status enum
 * Shared between backend and frontend
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}
