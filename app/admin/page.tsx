import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { AdminCounts, Recipe, HowToArticle, PageViewStats, PageViewTopPath, PageViewMonthly } from '@/lib/database.types'
import MonthlyTrafficChart from '@/components/admin/MonthlyTrafficChart'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const [countsResult, recentRecipesResult, recentHowTosResult, viewStatsResult, topPathsResult, monthlyResult] = await Promise.all([
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
    supabaseAdmin.from('page_view_stats').select('*').single(),
    supabaseAdmin.from('page_view_top_paths').select('*').limit(8),
    supabaseAdmin.from('page_view_monthly').select('*').order('month', { ascending: false }).limit(12),
  ])

  const counts = countsResult.data as AdminCounts | null
  const recentRecipes = (recentRecipesResult.data ?? []) as Pick<Recipe, 'id' | 'title' | 'slug' | 'published' | 'created_at' | 'difficulty'>[]
  const recentHowTos = (recentHowTosResult.data ?? []) as Pick<HowToArticle, 'id' | 'title' | 'slug' | 'published' | 'created_at' | 'section'>[]
  const viewStats = viewStatsResult.data as PageViewStats | null
  const topPaths = (topPathsResult.data ?? []) as PageViewTopPath[]
  const monthlyViews = ((monthlyResult.data ?? []) as PageViewMonthly[]).slice().reverse()

  const statCards = [
    { label: 'Published Recipes', value: counts?.published_recipes ?? 0, href: '/admin/recipes', color: 'text-[#4E7435]' },
    { label: 'Draft Recipes', value: counts?.draft_recipes ?? 0, href: '/admin/recipes', color: 'text-[#C58930]' },
    { label: 'Published How-Tos', value: counts?.published_howtos ?? 0, href: '/admin/how-tos', color: 'text-[#4E7435]' },
    { label: 'Published Ingredients', value: counts?.published_ingredients ?? 0, href: '/admin/ingredients', color: 'text-[#4E7435]' },
    { label: 'Total Users', value: counts?.total_users ?? 0, href: '#', color: 'text-[#201D20]' },
    { label: 'Newsletter Subscribers', value: counts?.mailing_list_subscribers ?? 0, href: '#', color: 'text-[#201D20]' },
  ]

  const trafficCards = [
    { label: 'Views Today', value: viewStats?.views_today ?? 0 },
    { label: 'Views (7 Days)', value: viewStats?.views_7d ?? 0 },
    { label: 'Views (30 Days)', value: viewStats?.views_30d ?? 0 },
    { label: 'Total Views', value: viewStats?.views_total ?? 0 },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#201D20]">Dashboard</h1>
        <p className="text-[#6D5E6D] mt-1">Overview of your baking encyclopedia content.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-[#EBD2AD] p-5 hover:border-[#C58930] transition-colors group"
          >
            <p className="text-xs font-medium text-[#6D5E6D] uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>

      {/* Traffic */}
      <div>
        <h2 className="text-sm font-semibold text-[#201D20] uppercase tracking-wide mb-3">Traffic</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {trafficCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-[#EBD2AD] p-5">
              <p className="text-xs font-medium text-[#6D5E6D] uppercase tracking-wide">{card.label}</p>
              <p className="text-3xl font-bold mt-1 text-[#201D20]">{card.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[#EBD2AD] p-6 mt-4">
          <h3 className="text-sm font-semibold text-[#201D20] mb-4">Views by Month</h3>
          <MonthlyTrafficChart data={monthlyViews} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6">
        <h2 className="text-base font-semibold text-[#201D20] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/recipes/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C58930] text-white rounded-lg font-medium text-sm hover:bg-[#A87225] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Recipe
          </Link>
          <Link
            href="/admin/ingredients/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EBD2AD] text-[#201D20] rounded-lg font-medium text-sm hover:border-[#C58930] hover:text-[#C58930] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Ingredient
          </Link>
          <Link
            href="/admin/how-tos/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EBD2AD] text-[#201D20] rounded-lg font-medium text-sm hover:border-[#C58930] hover:text-[#C58930] transition-colors"
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
        <div className="bg-white rounded-xl border border-[#EBD2AD] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#201D20]">Recent Recipes</h2>
            <Link href="/admin/recipes" className="text-xs text-[#C58930] hover:underline">View all</Link>
          </div>
          {recentRecipes.length === 0 ? (
            <p className="text-sm text-[#6D5E6D]">No recipes yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentRecipes.map((recipe) => (
                <li key={recipe.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#EBD2AD] last:border-0">
                  <div className="min-w-0">
                    <Link href={`/admin/recipes/${recipe.id}`} className="text-sm font-medium text-[#201D20] hover:text-[#C58930] truncate block">
                      {recipe.title}
                    </Link>
                    <span className="text-xs text-[#6D5E6D] capitalize">{recipe.difficulty}</span>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${recipe.published ? 'bg-[#EEF3EA] text-[#41622D]' : 'bg-[#FBF3DC] text-[#A87225]'}`}>
                    {recipe.published ? 'Published' : 'Draft'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent how-tos */}
        <div className="bg-white rounded-xl border border-[#EBD2AD] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#201D20]">Recent How-Tos</h2>
            <Link href="/admin/how-tos" className="text-xs text-[#C58930] hover:underline">View all</Link>
          </div>
          {recentHowTos.length === 0 ? (
            <p className="text-sm text-[#6D5E6D]">No how-to articles yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentHowTos.map((article) => (
                <li key={article.id} className="flex items-center justify-between gap-2 py-2 border-b border-[#EBD2AD] last:border-0">
                  <div className="min-w-0">
                    <Link href={`/admin/how-tos/${article.id}`} className="text-sm font-medium text-[#201D20] hover:text-[#C58930] truncate block">
                      {article.title}
                    </Link>
                    <span className="text-xs text-[#6D5E6D] capitalize">{article.section}</span>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${article.published ? 'bg-[#EEF3EA] text-[#41622D]' : 'bg-[#FBF3DC] text-[#A87225]'}`}>
                    {article.published ? 'Published' : 'Draft'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top pages */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#201D20]">Top Pages (30 Days)</h2>
          <Link href="/admin/traffic" className="text-xs text-[#C58930] hover:underline">View all pages</Link>
        </div>
        {topPaths.length === 0 ? (
          <p className="text-sm text-[#6D5E6D]">No traffic data yet.</p>
        ) : (
          <ul className="space-y-2">
            {topPaths.map((row) => (
              <li key={row.path} className="flex items-center justify-between gap-2 py-2 border-b border-[#EBD2AD] last:border-0">
                <span className="text-sm text-[#201D20] font-mono truncate">{row.path}</span>
                <span className="shrink-0 text-sm text-[#6D5E6D]">{row.views.toLocaleString()} views</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
