import { createBrowserClient } from '@supabase/ssr'

// Browser client — only for Client Components that need real-time or
// user-initiated Supabase calls. Do NOT use for data fetching that can
// be done server-side; prefer lib/supabase/server.ts in Server Components
// and Server Actions. Currently unused — kept for future real-time needs.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
