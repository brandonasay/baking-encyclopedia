import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Only use in Route Handlers and Server Actions — never in client components
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
