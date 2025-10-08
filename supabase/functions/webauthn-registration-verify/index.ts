import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyRegistrationResponse } from 'npm:@simplewebauthn/server@10.0.1';
import { createClient } from 'npm:@supabase/supabase-js@2';

const rpID = '127.0.0.1'; // Dev RP ID must match the host
const origin = 'http://127.0.0.1:5173'; // Dev origin

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, attestationResponse, challenge } = await req.json();

    if (!email || !attestationResponse || !challenge) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store the credential in Supabase using the caller's auth (RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      },
    );

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    await supabase.from('webauthn_credentials').insert({
      email,
      credential_id: Buffer.from(credentialID).toString('base64'),
      public_key: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
      transports: attestationResponse.response.transports || [],
    });

    return new Response(
      JSON.stringify({ verified: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
