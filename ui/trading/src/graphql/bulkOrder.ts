import { gql } from '@apollo/client';

export const PLACE_BULK_ORDER_MUTATION = gql`
  mutation PlaceBulkOrder($bulkOrder: BulkOrderInput!) {
    placeBulkOrder(bulkOrder: $bulkOrder) {
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
