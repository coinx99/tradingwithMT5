import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useMutation } from '@apollo/client/react';
import { apolloClient } from '../graphql/client';
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY, ICP_LOGIN_MUTATION } from '../graphql/user';
import type { User, AuthResponse, LoginResponse } from '../types/user';
import { appContext } from './App';
import { signOutIdentity } from '../utils/icpIdentity';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithIcp: (principal: string, challenge: string, signature: string, publicKey: string, certificate: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users for demo (when GraphQL server is not available)
const mockUsers = [
  { id: '1', username: 'admin', email: 'admin@example.com', password: 'admin123', name: 'Admin User', role: 'admin', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', username: 'moderator', email: 'moderator@example.com', password: 'mod123', name: 'Moderator User', role: 'moderator', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', username: 'user', email: 'user@example.com', password: 'user123', name: 'Regular User', role: 'user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

// Auth Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // GraphQL mutations
  const [registerMutation] = useMutation<{ register: AuthResponse }>(REGISTER_MUTATION);
  const [loginMutation] = useMutation<{ login: LoginResponse }>(LOGIN_MUTATION);
  const [icpLoginMutation] = useMutation<{ icpLogin: AuthResponse }>(ICP_LOGIN_MUTATION);

  // Function to refresh user data from server
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await apolloClient.query<{ me: User }>({
        query: ME_QUERY,
        fetchPolicy: 'network-only'
      });

      if (data?.me) {
        setUser(data.me);
        localStorage.setItem('user', JSON.stringify(data.me));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If token is invalid, clear auth data
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message || '';
        if (errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid token') || errorMessage.includes('Authentication required')) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      }
    }
  };

  const loginWithIcp = async (
    principal: string,
    challenge: string,
    signature: string,
    publicKey: string,
    certificate: string,
  ): Promise<boolean> => {
    setLoading(true);

    const { message } = appContext;

    try {
      const { data } = await icpLoginMutation({
        variables: {
          input: {
            principal,
            challenge,
            signature,
            publicKey,
            certificate,
          },
        },
      });

      if (data?.icpLogin) {
        const authResponse: AuthResponse = data.icpLogin;

        setUser(authResponse.user);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
        localStorage.setItem('token', authResponse.accessToken);
        localStorage.setItem('refreshToken', authResponse.refreshToken);

        message?.success('Login with ICP successful!');
        setLoading(false);
        return true;
      }

      message?.error('Login with ICP failed');
      setLoading(false);
      return false;
    } catch (error) {
      console.error('ICP login error:', error);
      message?.error('Login with ICP failed');
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    // Check for saved user in localStorage on mount
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Normalize role to lowercase for consistency
        if (parsedUser.role) {
          parsedUser.role = parsedUser.role.toLowerCase();
        }
        setUser(parsedUser);
        
        // Refresh user data from server to get latest role/permissions
        refreshUser();
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    setLoading(true);

    const { message } = appContext

    try {
      // Try GraphQL first
      try {
        const { data } = await loginMutation({
          variables: {
            input: {
              email: usernameOrEmail,
              password
            }
          }
        });

        if (data?.login) {
          const loginResponse: LoginResponse = data.login;
          
          if (loginResponse.success && loginResponse.accessToken && loginResponse.user) {
            setUser(loginResponse.user);
            localStorage.setItem('user', JSON.stringify(loginResponse.user));
            localStorage.setItem('token', loginResponse.accessToken);
            if (loginResponse.refreshToken) {
              localStorage.setItem('refreshToken', loginResponse.refreshToken);
            }

            message?.success(loginResponse.message || 'Login successful!');
            setLoading(false);
            return true;
          } else {
            message?.error(loginResponse.message || 'Login failed');
            setLoading(false);
            return false;
          }
        }
      } catch (graphqlError) {
        console.error('GraphQL login error:', graphqlError);

        // Fallback to mock authentication
        await new Promise(resolve => setTimeout(resolve, 1000));

        const foundUser = mockUsers.find(u => 
          (u.email === usernameOrEmail || u.username === usernameOrEmail) && 
          u.password === password
        );

        if (foundUser) {
          const userInfo: any = {
            id: foundUser.id,
            email: foundUser.email,
            username: foundUser.username,
            displayName: foundUser.name,
            roles: [foundUser.role],
            status: 'active',
            walletAddresses: [],
            isEmailVerified: true,
            twoFactorEnabled: false,
            isVerifiedSeller: false,
            totalSales: 0,
            totalEarnings: 0,
            rating: 0,
            reviewCount: 0,
            stakedAmount: 0,
            createdAt: new Date(foundUser.createdAt),
            updatedAt: new Date(foundUser.updatedAt)
          };
          // Generate a mock JWT-like token for testing
          const mockJWT = {
            header: { alg: 'HS256', typ: 'JWT' },
            payload: {
              user_id: userInfo.id,
              username: userInfo.username,
              role: userInfo.role,
              exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
              iat: Math.floor(Date.now() / 1000),
              token_type: 'access'
            }
          };
          
          // Create a fake JWT (just for testing - not secure!)
          const mockToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(mockJWT.payload))}.fake_signature_for_mock`;
          
          
          setUser(userInfo);
          localStorage.setItem('user', JSON.stringify(userInfo));
          localStorage.setItem('token', mockToken);
          message?.success('Login successful!');
          setLoading(false);
          return true;
        }

        message?.error('Invalid email or password');
        setLoading(false);
        return false;
      }

      message?.error('Login failed');
      setLoading(false);
      return false;
    } catch (error) {
      message?.error('Login failed');
      setLoading(false);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {

    setLoading(true);
    const { message } = appContext

    try {
      // Try GraphQL first
      try {
        // Generate username from email
        const username = email.split('@')[0];

        const variables = {
          input: {
            email,
            password,
            username,
            displayName: name
          }
        };

        const { data } = await registerMutation({ variables });

        if (data?.register) {
          const authResponse: AuthResponse = data.register;
          
          setUser(authResponse.user);
          localStorage.setItem('user', JSON.stringify(authResponse.user));
          localStorage.setItem('token', authResponse.accessToken);
          localStorage.setItem('refreshToken', authResponse.refreshToken);

          message?.success('Registration successful!');
          setLoading(false);
          return true;
        }
      } catch (graphqlError) {
        console.error('GraphQL register error:', graphqlError);

        // Fallback to mock authentication
        await new Promise(resolve => setTimeout(resolve, 1000));

        const existingUser = mockUsers.find(u => u.email === email);
        if (existingUser) {
          message?.error('Email already exists');
          setLoading(false);
          return false;
        }

        const newUser = {
          id: Date.now().toString(),
          email,
          name,
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        mockUsers.push({ ...newUser, password, username: newUser.email.split('@')[0] });
        const userInfo: any = {
          id: newUser.id,
          email: newUser.email,
          username: newUser.email.split('@')[0],
          displayName: newUser.name,
          roles: ['user'],
          status: 'active',
          walletAddresses: [],
          isEmailVerified: true,
          twoFactorEnabled: false,
          isVerifiedSeller: false,
          totalSales: 0,
          totalEarnings: 0,
          rating: 0,
          reviewCount: 0,
          stakedAmount: 0,
          createdAt: new Date(newUser.createdAt),
          updatedAt: new Date(newUser.updatedAt)
        };
        setUser(userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('token', 'mock-token');
        message?.success('Registration successful! (Mock mode)');
        setLoading(false);
        return true;
      }

      message?.error('Registration failed - unable to connect to server');
      setLoading(false);
      return false;
    } catch (error) {
      message?.error('Registration failed - unexpected error occurred');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    const { message } = appContext
    try {
      // Disconnect ICP wallet if connected
      try {
        await signOutIdentity();
        console.log('[ICP] Disconnected from Internet Identity');
      } catch (icpError) {
        console.warn('[ICP] Error disconnecting from Internet Identity:', icpError);
      }

      // Clear local data
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Clear Apollo Client cache
      await apolloClient.clearStore();

      message?.success('Logged out successfully');
    } catch (error) {
      // Still logout locally even if server call fails
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      await apolloClient.clearStore();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    loginWithIcp,
    logout,
    refreshUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
