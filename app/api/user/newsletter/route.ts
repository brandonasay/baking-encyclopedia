import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email } = body
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return Response.json({ error: 'A valid email is required' }, { status: 400 })
  }

  // If the user is logged in, update their profile
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { error } = await supabase
      .from('profiles')
      .update({ mailing_list: true })
      .eq('id', user.id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  // Always return success — email service integration can be added later
  return Response.json({ success: true })
}
