import { supabaseAdmin } from '@/lib/supabase/admin'
import NewRecipePage from './NewRecipePage'
import type { RecipeCategory, RecipeSubcategory } from '@/lib/database.types'

export const metadata = { title: 'New Recipe' }

export default async function Page() {
  const [categoriesResult, subcategoriesResult] = await Promise.all([
    supabaseAdmin.from('recipe_categories').select('*').order('sort_order'),
    supabaseAdmin.from('recipe_subcategories').select('*').order('sort_order'),
  ])

  const categories = (categoriesResult.data ?? []) as RecipeCategory[]
  const subcategories = (subcategoriesResult.data ?? []) as RecipeSubcategory[]

  return <NewRecipePage categories={categories} subcategories={subcategories} />
}
