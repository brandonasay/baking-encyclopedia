import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Ingredient } from '@/lib/database.types'
import DeleteButton from '../recipes/DeleteButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Ingredients' }

type IngredientRow = Pick<Ingredient, 'id' | 'name' | 'slug' | 'category' | 'published' | 'created_at'>

export default async function AdminIngredientsPage() {
  const { data } = await supabaseAdmin
    .from('ingredients')
    .select('id, name, slug, category, published, created_at')
    .order('created_at', { ascending: false })

  const ingredients = (data ?? []) as IngredientRow[]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1410]">Ingredients</h1>
          <p className="text-sm text-[#7A6A5E] mt-0.5">{ingredients.length} total</p>
        </div>
        <Link
          href="/admin/ingredients/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8652A] text-white rounded-lg font-medium text-sm hover:bg-[#B55A24] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Ingredient
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
        {ingredients.length === 0 ? (
          <div className="py-16 text-center text-[#7A6A5E]">
            <p>No ingredients yet.</p>
            <Link href="/admin/ingredients/new" className="text-[#C8652A] hover:underline mt-2 inline-block text-sm">Add your first ingredient</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D5] bg-[#FAF8F4]">
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E] hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E] hidden md:table-cell">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D5]">
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="hover:bg-[#FAF8F4] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/ingredients/${ingredient.id}`} className="font-medium text-[#1C1410] hover:text-[#C8652A]">
                        {ingredient.name}
                      </Link>
                      <p className="text-xs text-[#7A6A5E] font-mono">{ingredient.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-[#7A6A5E] hidden sm:table-cell">{ingredient.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ingredient.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {ingredient.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#7A6A5E] hidden md:table-cell">
                      {new Date(ingredient.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/ingredients/${ingredient.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-[#1C1410] border border-[#E8E0D5] rounded-lg hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={ingredient.id} label={ingredient.name} type="ingredients" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
