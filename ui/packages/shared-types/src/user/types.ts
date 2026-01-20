import { UserRole, UserStatus } from './enums.js';

/**
 * User interface
 * Shared between backend and frontend
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  roles: UserRole[];
  status: UserStatus;
  
  // Web3 fields
  walletAddresses: string[];
  primaryWallet?: string;
  
  // Verification
  isEmailVerified: boolean;
  
  // 2FA
  twoFactorEnabled: boolean;
  
  // Preferences
  theme?: string;
  language?: string;
  
  // Seller specific
  sellerDescription?: string;
  isVerifiedSeller: boolean;
  totalSales: number;
  totalEarnings: number;
  rating: number;
  reviewCount: number;
  
  // Staking
  stakedAmount: number;
  stakingExpiry?: Date;
  
  // Metadata
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

export interface UpdateUserInput {
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  theme?: string;
  language?: string;
}
