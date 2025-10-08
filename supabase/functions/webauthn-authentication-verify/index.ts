import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyAuthenticationResponse } from 'npm:@simplewebauthn/server@10.0.1';
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
    const { email, assertionResponse, challenge } = await req.json();

    if (!email || !assertionResponse || !challenge) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the credential from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credential } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('email', email)
      .eq('credential_id', Buffer.from(assertionResponse.id, 'base64url').toString('base64'))
      .single();

    if (!credential) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Credential not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(credential.credential_id, 'base64'),
        credentialPublicKey: Buffer.from(credential.public_key, 'base64'),
        counter: credential.counter,
      },
    });

    if (!verification.verified) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update counter
    await supabase
      .from('webauthn_credentials')
      .update({ counter: verification.authenticationInfo.newCounter })
      .eq('email', email)
      .eq('credential_id', credential.credential_id);

    // Create session for the user
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users.find((u) => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({ verified: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token (you may want to use Supabase auth.signInWithPassword or custom JWT)
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionError) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        verified: true,
        sessionToken: session.properties.hashed_token,
      }),
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
