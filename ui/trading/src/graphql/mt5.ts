import { gql } from '@apollo/client';

export const CONNECT_MT5_MUTATION = gql`
  mutation ConnectMt5($account: MT5AccountInput!) {
    connectMt5(account: $account) {
      id
      accountLogin
      server
      isConnected
      lastPing
      errorMessage
      createdAt
    }
  }
`;

export const MT5_ACCOUNT_INFO_QUERY = gql`
  query Mt5AccountInfo {
    mt5AccountInfo {
      login
      server
      name
      company
      currency
      balance
      equity
      margin
      marginFree
      leverage
    }
  }
`;

export const MT5_POSITIONS_LIVE_QUERY = gql`
  query Mt5PositionsLive {
    mt5PositionsLive {
      ticket
      symbol
      volume
      type
      priceOpen
      priceCurrent
      profit
      magic
      sl
      tp
    }
  }
`;

export const MT5_ORDERS_QUERY = gql`
  query Mt5Orders {
    mt5Orders {
      ticket
      symbol
      volumeCurrent
      type
      priceOpen
      sl
      tp
      magic
      state
    }
  }
`;

export const MT5_TRADING_HISTORY_QUERY = gql`
  query TradingHistory {
    tradingHistory {
      id
      symbol
      volume
      type
      price
      profit
      commission
      swap
      ticketId
      magic
      openTime
      closeTime
    }
  }
`;

export const PLACE_ORDER_MUTATION = gql`
  mutation PlaceOrder($order: OrderInput!) {
    placeOrder(order: $order) {
      id
      symbol
      volume
      type
      price
      sl
      tp
      status
      ticketId
      magic
      createdAt
      filledAt
    }
  }
`;

export const CLOSE_POSITION_MUTATION = gql`
  mutation ClosePosition($positionId: String!) {
    closePosition(positionId: $positionId)
  }
`;
