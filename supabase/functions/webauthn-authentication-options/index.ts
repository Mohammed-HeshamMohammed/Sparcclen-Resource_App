import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { generateAuthenticationOptions } from 'npm:@simplewebauthn/server@10.0.1';
import { createClient } from 'npm:@supabase/supabase-js@2';

const rpID = '127.0.0.1'; // Dev RP ID must match the host

serve(async (req) => {
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

    // Get stored credentials for this user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: credentials } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('email', email);

    if (!credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No credentials found for this user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((cred) => ({
        id: Buffer.from(cred.credential_id, 'base64'),
        type: 'public-key',
        transports: cred.transports,
      })),
      userVerification: 'preferred', // This triggers Windows Hello (PIN/fingerprint/face)
    });

    return new Response(
      JSON.stringify(options),
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
