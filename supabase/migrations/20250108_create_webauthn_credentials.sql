-- Create table for storing WebAuthn credentials (passkeys)
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_email ON public.webauthn_credentials(email);

-- Create index on credential_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON public.webauthn_credentials(credential_id);

-- Enable Row Level Security
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own credentials
CREATE POLICY "Users can view their own WebAuthn credentials"
  ON public.webauthn_credentials
  FOR SELECT
  USING (auth.email() = email);

-- Create policy to allow service role to manage all credentials
CREATE POLICY "Service role can manage all WebAuthn credentials"
  ON public.webauthn_credentials
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment to table
COMMENT ON TABLE public.webauthn_credentials IS 'Stores WebAuthn (Windows Hello/passkey) credentials for users';
