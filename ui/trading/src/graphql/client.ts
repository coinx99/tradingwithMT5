import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpUrl = '/graphql'
let wsUrl = `${document.location.protocol === "https:" ? "wss://" : "ws://"}${document.location.host}/graphql`;

// HTTP Link for queries and mutations
const httpLink = new HttpLink({
  uri: httpUrl,
});

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = localStorage.getItem('token');
      return {
        Authorization: token ? `Bearer ${token}` : '',
      };
    },
  })
);

// Authentication Link
const authLink = setContext((_, { headers }: any) => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');

  const authHeaders: any = {
    ...headers,
  };

  if (token) {
    // Try both uppercase and lowercase (some backends are case-sensitive)
    authHeaders['Authorization'] = `Bearer ${token}`;
    authHeaders['authorization'] = `Bearer ${token}`;
  }

  if (sessionId) {
    authHeaders['X-Session-Id'] = sessionId;
  }

  return {
    headers: authHeaders,
  };
});

// Split Link - use ws for subscriptions, http for queries and mutations
const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Apollo Client configuration
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Add any cache policies if needed
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});