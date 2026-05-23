import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Recipe, RecipeDifficulty } from '@/lib/database.types'
import DeleteButton from './DeleteButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Recipes' }

type RecipeRow = Pick<Recipe, 'id' | 'title' | 'slug' | 'difficulty' | 'published' | 'featured' | 'created_at'> & {
  category_name?: string | null
}

export default async function AdminRecipesPage() {
  const { data } = await supabaseAdmin
    .from('recipes')
    .select('id, title, slug, difficulty, published, featured, created_at, category_id')
    .order('created_at', { ascending: false })

  const recipes = (data ?? []) as RecipeRow[]

  const difficultyLabel: Record<RecipeDifficulty, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1410]">Recipes</h1>
          <p className="text-sm text-[#7A6A5E] mt-0.5">{recipes.length} total</p>
        </div>
        <Link
          href="/admin/recipes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8652A] text-white rounded-lg font-medium text-sm hover:bg-[#B55A24] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Recipe
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
        {recipes.length === 0 ? (
          <div className="py-16 text-center text-[#7A6A5E]">
            <p>No recipes yet.</p>
            <Link href="/admin/recipes/new" className="text-[#C8652A] hover:underline mt-2 inline-block text-sm">Create your first recipe</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D5] bg-[#FAF8F4]">
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E]">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E] hidden sm:table-cell">Difficulty</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E] hidden md:table-cell">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D5]">
                {recipes.map((recipe) => (
                  <tr key={recipe.id} className="hover:bg-[#FAF8F4] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <Link href={`/admin/recipes/${recipe.id}`} className="font-medium text-[#1C1410] hover:text-[#C8652A]">
                          {recipe.title}
                        </Link>
                        {recipe.featured && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-[#F5EDE4] text-[#C8652A] rounded font-medium">Featured</span>
                        )}
                        <p className="text-xs text-[#7A6A5E] font-mono">{recipe.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="capitalize text-[#7A6A5E]">{difficultyLabel[recipe.difficulty]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${recipe.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {recipe.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#7A6A5E] hidden md:table-cell">
                      {new Date(recipe.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/recipes/${recipe.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-[#1C1410] border border-[#E8E0D5] rounded-lg hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={recipe.id} label={recipe.title} type="recipes" />
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
