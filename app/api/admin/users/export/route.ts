import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function GET() {
  const { error } = await getAdminUser()
  if (error) return error

  const { data: subscribers, error: dbError } = await supabaseAdmin
    .from('profiles')
    .select('email, display_name, created_at')
    .eq('mailing_list', true)
    .order('created_at', { ascending: false })

  if (dbError) return Response.json({ error: dbError.message }, { status: 500 })

  const rows = subscribers ?? []

  const header = 'email,display_name,joined_at'
  const csvRows = rows.map((row) => {
    const email = `"${(row.email ?? '').replace(/"/g, '""')}"`
    const name = `"${(row.display_name ?? '').replace(/"/g, '""')}"`
    const joined = `"${row.created_at ?? ''}"`
    return `${email},${name},${joined}`
  })

  const csv = [header, ...csvRows].join('\n')

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mailing-list.csv"',
    },
  })
}
