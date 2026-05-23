import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { AdminCounts, Recipe, HowToArticle } from '@/lib/database.types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const [countsResult, recentRecipesResult, recentHowTosResult] = await Promise.all([
    supabaseAdmin.from('admin_content_counts').select('*').single(),
    supabaseAdmin
      .from('recipes')
      .select('id, title, slug, published, created_at, difficulty')
      .order('created_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('howto_articles')
      .select('id, title, slug, published, created_at, section')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const counts = countsResult.data as AdminCounts | null
  const recentRecipes = (recentRecipesResult.data ?? []) as Pick<Recipe, 'id' | 'title' | 'slug' | 'published' | 'created_at' | 'difficulty'>[]
  const recentHowTos = (recentHowTosResult.data ?? []) as Pick<HowToArticle, 'id' | 'title' | 'slug' | 'published' | 'created_at' | 'section'>[]

  const statCards = [
    { label: 'Published Recipes', value: counts?.published_recipes ?? 0, href: '/admin/recipes', color: 'text-emerald-600' },
    { label: 'Draft Recipes', value: counts?.draft_recipes ?? 0, href: '/admin/recipes', color: 'text-amber-600' },
    { label: 'Published How-Tos', value: counts?.published_howtos ?? 0, href: '/admin/how-tos', color: 'text-emerald-600' },
    { label: 'Published Ingredients', value: counts?.published_ingredients ?? 0, href: '/admin/ingredients', color: 'text-emerald-600' },
    { label: 'Total Users', value: counts?.total_users ?? 0, href: '#', color: 'text-[#1C1410]' },
    { label: 'Newsletter Subscribers', value: counts?.mailing_list_subscribers ?? 0, href: '#', color: 'text-[#1C1410]' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1410]">Dashboard</h1>
        <p className="text-[#7A6A5E] mt-1">Overview of your baking encyclopedia content.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-[#E8E0D5] p-5 hover:border-[#C8652A] transition-colors group"
          >
            <p className="text-xs font-medium text-[#7A6A5E] uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-[#E8E0D5] p-6">
        <h2 className="text-base font-semibold text-[#1C1410] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/recipes/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8652A] text-white rounded-lg font-medium text-sm hover:bg-[#B55A24] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Recipe
          </Link>
          <Link
            href="/admin/ingredients/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E0D5] text-[#1C1410] rounded-lg font-medium text-sm hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Ingredient
          </Link>
          <Link
            href="/admin/how-tos/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E0D5] text-[#1C1410] rounded-lg font-medium text-sm hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New How-To
          </Link>
        </div>
      </div>

      {/* Recent items */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent recipes */}
        <div className="bg-white rounded-xl border border-[#E8E0D5] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1C1410]">Recent Recipes</h2>
            <Link href="/admin/recipes" className="text-xs text-[#C8652A] hover:underline">View all</Link>
          </div>
          {recentRecipes.length === 0 ? (
            <p className="text-sm text-[#7A6A5E]">No recipes yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentRecipes.map((recipe) => (
                <li key={recipe.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#E8E0D5] last:border-0">
                  <div className="min-w-0">
                    <Link href={`/admin/recipes/${recipe.id}`} className="text-sm font-medium text-[#1C1410] hover:text-[#C8652A] truncate block">
                      {recipe.title}
                    </Link>
                    <span className="text-xs text-[#7A6A5E] capitalize">{recipe.difficulty}</span>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${recipe.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {recipe.published ? 'Published' : 'Draft'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent how-tos */}
        <div className="bg-white rounded-xl border border-[#E8E0D5] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1C1410]">Recent How-Tos</h2>
            <Link href="/admin/how-tos" className="text-xs text-[#C8652A] hover:underline">View all</Link>
          </div>
          {recentHowTos.length === 0 ? (
            <p className="text-sm text-[#7A6A5E]">No how-to articles yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentHowTos.map((article) => (
                <li key={article.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#E8E0D5] last:border-0">
                  <div className="min-w-0">
                    <Link href={`/admin/how-tos/${article.id}`} className="text-sm font-medium text-[#1C1410] hover:text-[#C8652A] truncate block">
                      {article.title}
                    </Link>
                    <span className="text-xs text-[#7A6A5E] capitalize">{article.section}</span>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${article.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {article.published ? 'Published' : 'Draft'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
