import { gql } from '@apollo/client';

// Fragments
export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    email
    principalId
    username
    displayName
    avatar
    bio
    roles
    status
    walletAddresses
    primaryWallet
    isEmailVerified
    twoFactorEnabled
    theme
    language
    sellerDescription
    isVerifiedSeller
    totalSales
    totalEarnings
    rating
    reviewCount
    stakedAmount
    stakingExpiry
    lastLoginAt
    lastLoginIp
    createdAt
    updatedAt
  }
`;

// Auth Mutations
export const LOGIN_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        ...UserFields
      }
    }
  }
`;

export const GENERATE_ICP_CHALLENGE = gql`
  query GenerateIcpChallenge($principal: String!) {
    generateIcpChallenge(principal: $principal)
  }
`;

export const ICP_LOGIN_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation IcpLogin($input: IcpLoginInput!) {
    icpLogin(input: $input) {
      accessToken
      refreshToken
      user {
        ...UserFields
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation Register($input: CreateUserInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        ...UserFields
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      user {
        ...UserFields
      }
    }
  }
`;

// Auth Queries
export const ME_QUERY = gql`
  ${USER_FRAGMENT}
  query Me {
    me {
      ...UserFields
    }
  }
`;

// User Queries
export const GET_USERS_QUERY = gql`
  ${USER_FRAGMENT}
  query GetUsers($limit: Float, $offset: Float) {
    users(limit: $limit, offset: $offset) {
      ...UserFields
    }
  }
`;

export const GET_USER_QUERY = gql`
  ${USER_FRAGMENT}
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserFields
    }
  }
`;

export const GET_USER_BY_WALLET_QUERY = gql`
  ${USER_FRAGMENT}
  query GetUserByWallet($walletAddress: String!) {
    userByWallet(walletAddress: $walletAddress) {
      ...UserFields
    }
  }
`;

// User Mutations
export const CREATE_USER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      ...UserFields
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ...UserFields
    }
  }
`;

export const UPDATE_USER_BY_ID_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation UpdateUserById($id: String!, $input: UpdateUserInput!) {
    updateUserById(id: $id, input: $input) {
      ...UserFields
    }
  }
`;

export const ADMIN_UPDATE_USER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation AdminUpdateUser($id: String!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      ...UserFields
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      ...UserFields
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser {
    deleteUser
  }
`;

export const LINK_WALLET_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation LinkWallet($walletAddress: String!) {
    linkWallet(walletAddress: $walletAddress) {
      ...UserFields
    }
  }
`;

export const UNLINK_WALLET_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation UnlinkWallet($walletAddress: String!) {
    unlinkWallet(walletAddress: $walletAddress) {
      ...UserFields
    }
  }
`;

export const SET_PRIMARY_WALLET_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation SetPrimaryWallet($walletAddress: String!) {
    setPrimaryWallet(walletAddress: $walletAddress) {
      ...UserFields
    }
  }
`;
