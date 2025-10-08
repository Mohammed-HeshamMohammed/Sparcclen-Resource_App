import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { generateRegistrationOptions } from 'npm:@simplewebauthn/server@10.0.1';

const rpName = 'Sparcclen';
const rpID = '127.0.0.1'; // Dev RP ID must match page origin's host
const origin = 'http://127.0.0.1:5173'; // Dev origin (see package.json debug URL)

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WebAuthn] Generating registration options for: ${email}`);

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: email,
      userName: email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred', // This triggers Windows Hello (PIN/fingerprint/face)
      },
    });

    console.log('[WebAuthn] Registration options generated successfully');

    return new Response(
      JSON.stringify(options),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[WebAuthn] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
