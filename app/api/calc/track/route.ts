import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'

const MAX_EVENT_NAME_LENGTH = 100
const MAX_SESSION_ID_LENGTH = 100

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { event_name, properties, session_id } = body
  if (typeof event_name !== 'string' || event_name.length === 0 || event_name.length > MAX_EVENT_NAME_LENGTH) {
    return Response.json({ error: 'event_name is required' }, { status: 400 })
  }
  if (session_id != null && (typeof session_id !== 'string' || session_id.length > MAX_SESSION_ID_LENGTH)) {
    return Response.json({ error: 'invalid session_id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabaseAdmin.from('calc_events').insert({
    user_id: user?.id ?? null,
    session_id: typeof session_id === 'string' ? session_id : null,
    event_name,
    properties: (properties && typeof properties === 'object' ? properties : {}) as Json,
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true }, { status: 201 })
}
