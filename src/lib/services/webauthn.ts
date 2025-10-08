import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { supabase } from './supabase';

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}

/**
 * Check if WebAuthn (Windows Hello) is supported
 */
export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn();
}

/**
 * Register a new passkey (Windows Hello credential)
 * This will trigger the Windows Hello enrollment dialog
 */
export async function registerPasskey(email: string): Promise<boolean> {
  try {
    // Request registration options from server
    const response = await supabase.functions.invoke(
      'webauthn-registration-options',
      {
        body: { email },
      }
    );

    console.log('[WebAuthn] Raw response:', response);

    if (response.error || !response.data) {
      console.error('Failed to get registration options:', response.error);
      return false;
    }

    const optionsData = response.data;
    console.log('[WebAuthn] Registration options received:', optionsData);

    // Trigger Windows Hello enrollment
    const attestationResponse = await startRegistration(optionsData);

    // Verify registration with server
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
      'webauthn-registration-verify',
      {
        body: {
          email,
          attestationResponse,
          challenge: optionsData.challenge,
        },
      }
    );

    if (verifyError || !verifyData?.verified) {
      console.error('Failed to verify registration:', verifyError);
      return false;
    }

    console.log('✅ Windows Hello passkey registered successfully');
    return true;
  } catch (error: any) {
    console.error('WebAuthn registration error:', error);
    
    // User cancelled
    if (error.name === 'NotAllowedError') {
      console.log('User cancelled Windows Hello registration');
    }
    
    return false;
  }
}

/**
 * Authenticate using passkey (Windows Hello)
 * This will trigger the Windows Security dialog with PIN/fingerprint/face
 */
export async function authenticateWithPasskey(email: string): Promise<{
  success: boolean;
  sessionToken?: string;
  error?: string;
}> {
  try {
    // Request authentication options from server
    const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
      'webauthn-authentication-options',
      {
        body: { email },
      }
    );

    if (optionsError || !optionsData) {
      return {
        success: false,
        error: 'Failed to get authentication options',
      };
    }

    // Trigger Windows Hello authentication (this shows the Windows Security dialog!)
    const assertionResponse = await startAuthentication(optionsData);

    // Verify authentication with server
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
      'webauthn-authentication-verify',
      {
        body: {
          email,
          assertionResponse,
          challenge: optionsData.challenge,
        },
      }
    );

    if (verifyError || !verifyData?.verified) {
      return {
        success: false,
        error: 'Authentication verification failed',
      };
    }

    console.log('✅ Windows Hello authentication successful');
    
    return {
      success: true,
      sessionToken: verifyData.sessionToken,
    };
  } catch (error: any) {
    console.error('WebAuthn authentication error:', error);
    
    // User cancelled
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Authentication cancelled',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
}

/**
 * Check if user has registered passkey
 */
export async function hasRegisteredPasskey(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('webauthn-has-credential', {
      body: { email },
    });

    if (error) {
      console.error('Failed to check credential:', error);
      return false;
    }

    return data?.hasCredential || false;
  } catch (error) {
    console.error('Error checking passkey:', error);
    return false;
  }
}
