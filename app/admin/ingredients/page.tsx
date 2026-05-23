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
          <h1 className="text-2xl font-bold text-[#201D20]">Ingredients</h1>
          <p className="text-sm text-[#6D5E6D] mt-0.5">{ingredients.length} total</p>
        </div>
        <Link
          href="/admin/ingredients/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C58930] text-white rounded-lg font-medium text-sm hover:bg-[#A87225] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Ingredient
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] overflow-hidden">
        {ingredients.length === 0 ? (
          <div className="py-16 text-center text-[#6D5E6D]">
            <p>No ingredients yet.</p>
            <Link href="/admin/ingredients/new" className="text-[#C58930] hover:underline mt-2 inline-block text-sm">Add your first ingredient</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EBD2AD] bg-[#FCFFEB]">
                  <th className="text-left px-4 py-3 font-medium text-[#6D5E6D]">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6D5E6D] hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6D5E6D]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#6D5E6D] hidden md:table-cell">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBD2AD]">
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="hover:bg-[#FCFFEB] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/ingredients/${ingredient.id}`} className="font-medium text-[#201D20] hover:text-[#C58930]">
                        {ingredient.name}
                      </Link>
                      <p className="text-xs text-[#6D5E6D] font-mono">{ingredient.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-[#6D5E6D] hidden sm:table-cell">{ingredient.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ingredient.published ? 'bg-[#EEF3EA] text-[#41622D]' : 'bg-[#FBF3DC] text-[#A87225]'}`}>
                        {ingredient.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6D5E6D] hidden md:table-cell">
                      {new Date(ingredient.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/ingredients/${ingredient.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-[#201D20] border border-[#EBD2AD] rounded-lg hover:border-[#C58930] hover:text-[#C58930] transition-colors"
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
