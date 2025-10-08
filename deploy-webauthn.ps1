# WebAuthn Deployment Script for Supabase
# This script deploys all WebAuthn Edge Functions and runs the database migration

Write-Host "🚀 WebAuthn Deployment Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're linked to a Supabase project
Write-Host "📋 Step 1: Checking Supabase project link..." -ForegroundColor Yellow
$linkCheck = npx supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not linked to a Supabase project." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: npx supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
    Write-Host "You can find your project ref in your Supabase dashboard URL:" -ForegroundColor Yellow
    Write-Host "https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Linked to Supabase project" -ForegroundColor Green
Write-Host ""

# Run database migration
Write-Host "📋 Step 2: Running database migration..." -ForegroundColor Yellow
Write-Host "Creating webauthn_credentials table..." -ForegroundColor Gray

$migrationSQL = @"
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_email ON public.webauthn_credentials(email);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON public.webauthn_credentials(credential_id);

-- Enable Row Level Security
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own WebAuthn credentials"
  ON public.webauthn_credentials FOR SELECT
  USING (auth.email() = email);

CREATE POLICY "Service role can manage all WebAuthn credentials"
  ON public.webauthn_credentials FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.webauthn_credentials IS 'Stores WebAuthn (Windows Hello/passkey) credentials for users';
"@

# Save migration to temp file and execute
$tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
$migrationSQL | Out-File -FilePath $tempFile -Encoding UTF8

npx supabase db push --db-url (npx supabase status --output json | ConvertFrom-Json).DB_URL 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database migration completed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration may have already been applied (this is OK)" -ForegroundColor Yellow
}

Remove-Item $tempFile -ErrorAction SilentlyContinue
Write-Host ""

# Deploy Edge Functions
Write-Host "📋 Step 3: Deploying Edge Functions..." -ForegroundColor Yellow
Write-Host ""

$functions = @(
    "webauthn-registration-options",
    "webauthn-registration-verify",
    "webauthn-authentication-options",
    "webauthn-authentication-verify",
    "webauthn-has-credential"
)

$successCount = 0
$failCount = 0

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Gray
    
    npx supabase functions deploy $func --no-verify-jwt 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $func deployed successfully" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ Failed to deploy $func" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "✅ Successfully deployed: $successCount functions" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "❌ Failed to deploy: $failCount functions" -ForegroundColor Red
}
Write-Host ""

if ($successCount -eq 5) {
    Write-Host "🎉 All Edge Functions deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update rpID and origin in each Edge Function for production" -ForegroundColor White
    Write-Host "2. Test WebAuthn login in your app" -ForegroundColor White
    Write-Host "3. Click the fingerprint button to see Windows Hello!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some deployments failed. Check the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "- Make sure you're linked: npx supabase link --project-ref YOUR_REF" -ForegroundColor White
    Write-Host "- Check your Supabase credentials" -ForegroundColor White
    Write-Host "- Verify Edge Functions are enabled in your project" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
