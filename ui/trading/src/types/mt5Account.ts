export interface SavedAccount {
  id: string;
  login: number;
  server: string;
  path?: string;
  is_active: boolean;
  last_connected?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveAccountInput {
  login: number;
  password: string;
  server: string;
  path?: string;
}

export interface UpdateAccountInput {
  account_id: string;
  password?: string;
  path?: string;
}
