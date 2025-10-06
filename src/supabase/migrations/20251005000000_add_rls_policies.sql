-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for app_settings
CREATE POLICY "Users can view their own settings"
  ON app_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON app_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON app_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

-- Functions to ensure TOTP secrets are only accessible to their owners
CREATE OR REPLACE FUNCTION get_totp_secret(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT totp_secret 
  FROM app_settings 
  WHERE user_id = auth.uid() 
  AND user_id = get_totp_secret.user_id;
$$;

-- Revoke direct table access and grant through functions
REVOKE ALL ON app_settings FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_totp_secret TO authenticated;

-- Grant minimal required permissions
GRANT SELECT, INSERT, UPDATE ON app_settings TO authenticated;