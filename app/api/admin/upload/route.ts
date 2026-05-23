import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

const ALLOWED_BUCKETS = ['recipe-images', 'ingredient-images', 'howto-images'] as const
type AllowedBucket = typeof ALLOWED_BUCKETS[number]

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user, error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function POST(request: Request) {
  const { error } = await getAdminUser()
  if (error) return error

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const bucket = formData.get('bucket') as string | null

  if (!file || !(file instanceof File)) {
    return Response.json({ error: 'file is required' }, { status: 400 })
  }

  if (!bucket || !ALLOWED_BUCKETS.includes(bucket as AllowedBucket)) {
    return Response.json(
      { error: `bucket must be one of: ${ALLOWED_BUCKETS.join(', ')}` },
      { status: 400 }
    )
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: 'File must be image/jpeg, image/png, or image/webp' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: 'File exceeds 5MB limit' }, { status: 400 })
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const fileName = `${randomUUID()}.${ext}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { data, error: uploadError } = await supabaseAdmin.storage
    .from(bucket as AllowedBucket)
    .upload(fileName, fileBuffer, { contentType: file.type, upsert: false })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const publicUrl = supabaseAdmin.storage
    .from(bucket as AllowedBucket)
    .getPublicUrl(data.path).data.publicUrl

  return Response.json({ url: publicUrl }, { status: 201 })
}
