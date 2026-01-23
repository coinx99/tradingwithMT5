// GraphQL Response Types
export interface ConnectSavedAccountResponse {
  connectSavedAccount: {
    status: 'SUCCESS' | 'ERROR';
    message: string;
    data?: string;
    errorCode?: string;
    details?: string;
  };
}

export interface SaveMt5AccountResponse {
  saveMt5Account: {
    status: 'SUCCESS' | 'ERROR';
    message: string;
    data?: string;
    errorCode?: string;
    details?: string;
  };
}

export interface UpdateSavedAccountResponse {
  updateSavedAccount: {
    status: 'SUCCESS' | 'ERROR';
    message: string;
    data?: string;
    errorCode?: string;
    details?: string;
  };
}

export interface DeleteSavedAccountResponse {
  deleteSavedAccount: {
    status: 'SUCCESS' | 'ERROR';
    message: string;
    data?: string;
    errorCode?: string;
    details?: string;
  };
}

export interface ClosePositionResponse {
  closePosition: {
    status: 'SUCCESS' | 'ERROR';
    message: string;
    data?: string;
    errorCode?: string;
    details?: string;
  };
}

export interface PlaceBulkOrderResponse {
  placeBulkOrder: {
    status: 'SUCCESS' | 'ERROR';
    message: string;
    data?: string;
    errorCode?: string;
    details?: string;
  };
}

export interface MT5PositionsUpdatesResponse {
  mt5PositionsUpdates: any;
}

export interface MT5OrdersUpdatesResponse {
  mt5OrdersUpdates: any;
}

export interface MT5AccountUpdatesResponse {
  mt5AccountUpdates: any;
}
