import { gql } from '@apollo/client';

// Simple ping query to test GraphQL connection
export const PING_QUERY = gql`
  query Ping {
    ping
  }
`;
