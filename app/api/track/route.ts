import { supabaseAdmin } from '@/lib/supabase/admin'

const MAX_PATH_LENGTH = 500

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { path } = body
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.length === 0 ||
    path.length > MAX_PATH_LENGTH
  ) {
    return Response.json({ error: 'path must be a relative path starting with /' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('page_views').insert({ path })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true }, { status: 201 })
}
