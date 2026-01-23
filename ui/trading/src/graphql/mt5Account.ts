import { gql } from '@apollo/client';

export const SAVED_MT5_ACCOUNTS_QUERY = gql`
  query SavedMt5Accounts {
    savedMt5Accounts {
      id
      login
      server
      path
      is_active
      last_connected
      created_at
      updated_at
    }
  }
`;

export const SAVE_MT5_ACCOUNT_MUTATION = gql`
  mutation SaveMt5Account($account: SaveAccountInput!) {
    saveMt5Account(account: $account) {
      ... on SuccessResponse {
        status
        message
        data
      }
      ... on ErrorResponse {
        status
        message
        errorCode
        details
      }
    }
  }
`;

export const UPDATE_SAVED_ACCOUNT_MUTATION = gql`
  mutation UpdateSavedAccount($account: UpdateAccountInput!) {
    updateSavedAccount(account: $account) {
      ... on SuccessResponse {
        status
        message
        data
      }
      ... on ErrorResponse {
        status
        message
        errorCode
        details
      }
    }
  }
`;

export const DELETE_SAVED_ACCOUNT_MUTATION = gql`
  mutation DeleteSavedAccount($accountId: String!) {
    deleteSavedAccount(accountId: $accountId) {
      ... on SuccessResponse {
        status
        message
      }
      ... on ErrorResponse {
        status
        message
        errorCode
        details
      }
    }
  }
`;

export const CONNECT_SAVED_ACCOUNT_MUTATION = gql`
  mutation ConnectSavedAccount($accountId: String!) {
    connectSavedAccount(accountId: $accountId) {
      ... on SuccessResponse {
        status
        message
        data
      }
      ... on ErrorResponse {
        status
        message
        errorCode
        details
      }
    }
  }
`;
