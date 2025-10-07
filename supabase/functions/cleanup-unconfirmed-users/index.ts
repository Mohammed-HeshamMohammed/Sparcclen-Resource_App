// Supabase Edge Function to clean up unconfirmed users after 48 hours
// Deploy this to Supabase: supabase functions deploy cleanup-unconfirmed-users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type DeletedUser = { userId: string; email: string | null; createdAt: string }
type ErrorEntry = { userId: string; email: string | null; error: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase Admin client with service role key
    const supabaseAdmin = createClient(
      // Deno provides env vars at runtime in Supabase Edge Functions
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get all users (requires admin privileges)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      throw listError
    }

    // Calculate cutoff time (48 hours ago)
    const now = Date.now()
    const cutoffTime = now - (48 * 60 * 60 * 1000) // 48 hours in milliseconds

    // Filter unconfirmed users older than 48 hours
    const unconfirmedUsers = users.filter(user => {
      // User has not confirmed email
      const isUnconfirmed = !user.email_confirmed_at
      
      // User was created more than 48 hours ago
      const createdAt = new Date(user.created_at).getTime()
      const isOld = createdAt < cutoffTime
      
      return isUnconfirmed && isOld
    })

    console.log(`Found ${unconfirmedUsers.length} unconfirmed users to delete`)

    // Delete each unconfirmed user
    const deletedUsers: DeletedUser[] = []
    const errors: ErrorEntry[] = []

    for (const user of unconfirmedUsers) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.error(`Failed to delete user ${user.id}:`, deleteError)
          errors.push({ userId: user.id, email: user.email, error: deleteError.message })
        } else {
          console.log(`Deleted unconfirmed user: ${user.email} (created: ${user.created_at})`)
          deletedUsers.push({ userId: user.id, email: user.email, createdAt: user.created_at })
        }
      } catch (err) {
        console.error(`Exception deleting user ${user.id}:`, err)
        errors.push({ userId: user.id, email: user.email, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        totalChecked: users.length,
        totalUnconfirmed: unconfirmedUsers.length,
        totalDeleted: deletedUsers.length,
        deletedUsers,
        errors,
        cutoffTime: new Date(cutoffTime).toISOString(),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in cleanup function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
