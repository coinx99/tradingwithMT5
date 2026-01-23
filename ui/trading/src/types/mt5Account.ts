export interface SavedAccount {
  id: string;
  login: number;
  server: string;
  path?: string;
  isActive: boolean;
  lastConnected?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAccountInput {
  login: number;
  password: string;
  server: string;
  path?: string;
}

export interface UpdateAccountInput {
  accountId: string;
  login?: number;
  password?: string;
  server?: string;
  path?: string;
}
