import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user, supabase, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, supabase, error: null }
}

export async function GET(_request: Request) {
  const { error } = await getAdminUser()
  if (error) return error

  const { data: articles, error: dbError } = await supabaseAdmin
    .from('howto_articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json({ articles })
}

export async function POST(request: Request) {
  const { error } = await getAdminUser()
  if (error) return error

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { slug, title, section } = body
  if (!slug || typeof slug !== 'string') return Response.json({ error: 'slug is required' }, { status: 400 })
  if (!title || typeof title !== 'string') return Response.json({ error: 'title is required' }, { status: 400 })
  if (!section || typeof section !== 'string') return Response.json({ error: 'section is required' }, { status: 400 })

  const { data: article, error: dbError } = await supabaseAdmin
    .from('howto_articles')
    .insert(body as any)
    .select()
    .single()

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })
  return Response.json(article, { status: 201 })
}
