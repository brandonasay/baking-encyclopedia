import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { display_name?: string; mailing_list?: boolean }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const update: { display_name?: string; mailing_list?: boolean } = {}

  if (body.display_name !== undefined) {
    if (typeof body.display_name !== 'string') {
      return Response.json({ error: 'display_name must be a string' }, { status: 400 })
    }
    update.display_name = body.display_name.trim() || null as any
  }

  if (body.mailing_list !== undefined) {
    if (typeof body.mailing_list !== 'boolean') {
      return Response.json({ error: 'mailing_list must be a boolean' }, { status: 400 })
    }
    update.mailing_list = body.mailing_list
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(profile)
}
