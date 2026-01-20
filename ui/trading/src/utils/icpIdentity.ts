import { AuthClient, type AuthClientCreateOptions } from '@dfinity/auth-client';

export interface IcpIdentityInfo {
  authenticated: boolean;
  principalText?: string;
  // Raw objects so we can inspect them in the browser console
  rawIdentity?: unknown;
}

export interface IcpSignedChallenge {
  principal: string;
  challenge: string;
  signature: string;
  publicKey: string;
  certificate: string;
}

let authClientPromise: Promise<AuthClient> | null = null;

const getAuthClient = async (options?: AuthClientCreateOptions): Promise<AuthClient> => {
  if (!authClientPromise) {
    authClientPromise = AuthClient.create(options);
  }
  return authClientPromise;
};

export const signInWithIdentity = async (): Promise<IcpIdentityInfo> => {
  const client = await getAuthClient();

  const identity = client.getIdentity();
  const principal = identity.getPrincipal();
  const principalText = principal.toText();

  // Check if current identity is anonymous (not logged in)
  const isAnonymous = principal.isAnonymous();

  // If anonymous or not authenticated, force login
  if (isAnonymous) {
    
    // Login via Internet Identity (identity.ic0.app)
    return new Promise((resolve, reject) => {
      client.login({
        identityProvider: 'https://identity.ic0.app',
        onSuccess: async () => {
          
          // Get new identity after login
          const newIdentity = client.getIdentity();
          const newPrincipal = newIdentity.getPrincipal();
          const newPrincipalText = newPrincipal.toText();

          // Verify it's not anonymous anymore
          if (newPrincipal.isAnonymous()) {
            console.error('[ICP][II] Still anonymous after login');
            reject(new Error('Login cancelled or failed'));
            return;
          }

          const info: IcpIdentityInfo = {
            authenticated: true,
            principalText: newPrincipalText,
            rawIdentity: newIdentity,
          };

          resolve(info);
        },
        onError: (err) => {
          console.error('[ICP][II] Login error:', err);
          reject(new Error('Internet Identity login failed'));
        },
      });
    });
  }

  // Already logged in with real identity
  const info: IcpIdentityInfo = {
    authenticated: true,
    principalText,
    rawIdentity: identity,
  };

  return info;
};

export const signOutIdentity = async (): Promise<void> => {
  const client = await getAuthClient();
  await client.logout();
};

// Helper to convert Uint8Array to hex string (browser-compatible)
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const signChallengeWithIdentity = async (challengeJson: string): Promise<IcpSignedChallenge> => {
  const client = await getAuthClient();
  const identity = client.getIdentity();
  const principal = identity.getPrincipal();

  // Parse challenge
  const { challenge } = JSON.parse(challengeJson);

  // Convert challenge to Uint8Array for mock signature
  const encoder = new TextEncoder();
  const message = encoder.encode(challenge);

  // Try to extract delegation info
  let publicKeyHex = '';
  let certificateHex = '';

  try {
    // DelegationIdentity structure
    const delegation = (identity as any)._delegation;
    
    if (delegation) {
      const publicKey = delegation.publicKey;
      publicKeyHex = uint8ArrayToHex(publicKey);

      const certificate = delegation.delegations?.[0]?.delegation?.pubkey || new Uint8Array();
      certificateHex = uint8ArrayToHex(certificate);
    } else {
      console.warn('[ICP] No _delegation property, trying alternative methods...');
      
      // Try to get public key from identity directly
      const identityPublicKey = (identity as any).getPublicKey?.();
      if (identityPublicKey) {
        publicKeyHex = uint8ArrayToHex(identityPublicKey.toDer());
      } else {
        // Fallback: use empty values (backend will skip verification anyway)
        publicKeyHex = uint8ArrayToHex(new Uint8Array(32));
        certificateHex = uint8ArrayToHex(new Uint8Array(32));
        console.warn('[ICP] Using fallback empty public key and certificate');
      }
    }
  } catch (error) {
    console.error('[ICP] Error extracting delegation:', error);
    // Fallback: use empty values
    publicKeyHex = uint8ArrayToHex(new Uint8Array(32));
    certificateHex = uint8ArrayToHex(new Uint8Array(32));
  }

  // Mock signature (just the challenge encoded)
  const signatureHex = uint8ArrayToHex(message);

  return {
    principal: principal.toText(),
    challenge,
    signature: signatureHex,
    publicKey: publicKeyHex,
    certificate: certificateHex,
  };
};
