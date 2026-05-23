import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import HowToForm from '@/components/admin/HowToForm'
import type { HowToArticle } from '@/lib/database.types'

export const metadata = { title: 'Edit How-To' }

export default async function EditHowToPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data } = await supabaseAdmin.from('howto_articles').select('*').eq('id', id).single()
  if (!data) notFound()

  return <HowToForm article={data as HowToArticle} />
}
