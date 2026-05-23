import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import IngredientForm from '@/components/admin/IngredientForm'
import type { Ingredient } from '@/lib/database.types'

export const metadata = { title: 'Edit Ingredient' }

export default async function EditIngredientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data } = await supabaseAdmin.from('ingredients').select('*').eq('id', id).single()
  if (!data) notFound()

  return <IngredientForm ingredient={data as Ingredient} />
}
