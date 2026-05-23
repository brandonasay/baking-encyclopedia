import { supabaseAdmin } from '@/lib/supabase/admin'
import CategoriesManager from './CategoriesManager'

export const metadata = { title: 'Categories' }

type SubcategoryRow = {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  category_id: string
}

type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
  recipe_subcategories: SubcategoryRow[]
}

export default async function AdminCategoriesPage() {
  const { data } = await supabaseAdmin
    .from('recipe_categories')
    .select('*, recipe_subcategories(*)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const categories = (data ?? []) as unknown as CategoryRow[]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1410]">Categories</h1>
          <p className="text-sm text-[#7A6A5E] mt-0.5">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
      </div>

      <CategoriesManager categories={categories} />
    </div>
  )
}
