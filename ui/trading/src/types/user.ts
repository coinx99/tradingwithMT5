// User types matching services/user
// Import shared types from shared-types package
export {
  UserRole,
  UserStatus,
  type User,
  type AuthResponse,
  type LoginInput,
  type CreateUserInput,
  type UpdateUserInput,
} from '@ui/shared-types';

// Login response type for GraphQL
export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: import('@ui/shared-types').User;
}
