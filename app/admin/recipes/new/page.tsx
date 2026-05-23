import { supabaseAdmin } from '@/lib/supabase/admin'
import RecipeForm from '@/components/admin/RecipeForm'
import type { RecipeCategory, RecipeSubcategory } from '@/lib/database.types'

export const metadata = { title: 'New Recipe' }

export default async function NewRecipePage() {
  const [categoriesResult, subcategoriesResult] = await Promise.all([
    supabaseAdmin.from('recipe_categories').select('*').order('sort_order'),
    supabaseAdmin.from('recipe_subcategories').select('*').order('sort_order'),
  ])

  const categories = (categoriesResult.data ?? []) as RecipeCategory[]
  const subcategories = (subcategoriesResult.data ?? []) as RecipeSubcategory[]

  return <RecipeForm categories={categories} subcategories={subcategories} />
}
