import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xazooidoebbqvwcdhdmk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhem9vaWRvZWJicXZ3Y2RoZG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTAzMDQsImV4cCI6MjA2NTQ2NjMwNH0.uw1WGlCGpO00IFjBn2hTldinKwT0qLHIm4NAxWjg4qk'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side client for API routes
export const createServerSupabaseClient = () => {
  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
} 