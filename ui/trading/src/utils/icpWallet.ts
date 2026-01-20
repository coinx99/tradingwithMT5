// Simple ICP Plug wallet helper for frontend
// This uses the global `window.ic.plug` object exposed by the Plug browser extension.

// We keep types very loose here to avoid adding extra dependencies.

export interface IcpWalletInfo {
  connected: boolean;
  principalText?: string;
  rawPrincipal?: unknown;
}

declare global {
  interface Window {
    ic?: {
      plug?: {
        isConnected: () => Promise<boolean> | boolean;
        requestConnect: (opts?: Record<string, unknown>) => Promise<boolean>;
        agent?: {
          getPrincipal?: () => Promise<unknown>;
        };
      };
    };
  }
}

/**
 * Check if Plug wallet is injected.
 */
export const isPlugAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.ic?.plug;
};

/**
 * Connect to Plug wallet and return basic info (principal, etc.).
 * This is frontend-only, for debug and future mapping to backend User fields.
 */
export const connectIcpWallet = async (): Promise<IcpWalletInfo> => {
  if (!isPlugAvailable()) {
    console.warn('[ICP] Plug wallet not available on window.ic.plug');
    return { connected: false };
  }

  const plug = window.ic!.plug!;

  try {
    // Try existing connection first
    const alreadyConnected = await Promise.resolve(plug.isConnected());

    if (!alreadyConnected) {
      // Minimal requestConnect; whitelist/host có thể cấu hình sau
      const ok = await plug.requestConnect();
      if (!ok) {
        console.warn('[ICP] User rejected Plug connection');
        return { connected: false };
      }
    }

    const principal = await plug.agent?.getPrincipal?.();
    const principalText = (principal as any)?.toText?.() ?? String(principal ?? '');

    const info: IcpWalletInfo = {
      connected: true,
      principalText,
      rawPrincipal: principal,
    };

    return info;
  } catch (error) {
    console.error('[ICP] Error connecting to Plug wallet:', error);
    return { connected: false };
  }
};
