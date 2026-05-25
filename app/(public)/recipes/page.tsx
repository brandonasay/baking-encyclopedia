import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import RecipeCard from '@/components/recipes/RecipeCard'
import RecipeFilters from '@/components/recipes/RecipeFilters'
import type { Recipe } from '@/lib/database.types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Recipes',
  description:
    'Browse our full collection of baking recipes — from beginner-friendly breads to advanced pastries.',
}

const PAGE_SIZE = 24

type SearchParams = Promise<{
  q?: string
  page?: string
}>

export default async function RecipesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()

  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Build recipe query
  let query = supabase
    .from('recipes')
    .select(
      'id, slug, title, headline, image_url, difficulty, total_time_minutes, tags, has_gluten_free, has_high_protein, category_id, recipe_categories(slug)',
      { count: 'exact' }
    )
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Text search via search_all RPC — filter ids then query
  let searchResultIds: string[] | null = null
  if (params.q) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: searchResults } = await (supabase as any).rpc('search_all', {
      query: params.q,
      result_limit: 100,
    })
    const typed = (searchResults ?? []) as { id: string; content_type: string }[]
    searchResultIds = typed
      .filter((r) => r.content_type === 'recipe')
      .map((r) => r.id)
    if (searchResultIds.length === 0) {
      return (
        <RecipesPageShell>
          <EmptyState query={params.q} />
        </RecipesPageShell>
      )
    }
    query = query.in('id', searchResultIds)
  }

  const { data: recipesData, count } = await query
  type RecipeCardFields = Pick<Recipe, 'id' | 'slug' | 'title' | 'headline' | 'image_url' | 'difficulty' | 'total_time_minutes' | 'tags' | 'has_gluten_free' | 'has_high_protein'> & { recipe_categories?: { slug: string } | null }
  const recipes = (recipesData ?? []) as unknown as RecipeCardFields[]

  const totalCount = count ?? 0
  const hasMore = to < totalCount - 1

  return (
    <RecipesPageShell>
      {/* Result header */}
      <div className="flex items-baseline justify-between mb-6">
        <p className="text-sm text-[#6D5E6D]">
          {params.q ? (
            <>
              {totalCount} result{totalCount !== 1 ? 's' : ''} for{' '}
              <span className="font-medium text-[#201D20]">&ldquo;{params.q}&rdquo;</span>
            </>
          ) : (
            <>
              {totalCount} recipe{totalCount !== 1 ? 's' : ''}
            </>
          )}
        </p>
      </div>

      {recipes && recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} categorySlug={(recipe as any).recipe_categories?.slug} />
            ))}
          </div>

          {/* Pagination: load more */}
          {hasMore && (
            <div className="mt-12 flex justify-center">
              <a
                href={buildPageUrl(params, page + 1)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C58930] text-white font-medium hover:bg-[#A87225] transition-colors"
              >
                Load more recipes
              </a>
            </div>
          )}
        </>
      ) : (
        <EmptyState query={params.q} />
      )}
    </RecipesPageShell>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildPageUrl(params: Awaited<SearchParams>, nextPage: number): string {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', params.q)
  qs.set('page', String(nextPage))
  return `/recipes?${qs.toString()}`
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="py-20 text-center space-y-4">
      <p className="text-5xl" aria-hidden="true">
        🥐
      </p>
      <h2
        className="text-2xl font-semibold text-[#201D20]"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        No recipes found
      </h2>
      <p className="text-[#6D5E6D] max-w-sm mx-auto">
        {query
          ? `We couldn't find any recipes matching "${query}". Try a different search or clear your filters.`
          : "Try adjusting your filters to find what you're looking for."}
      </p>
      <a
        href="/recipes"
        className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#C58930] text-white font-medium hover:bg-[#A87225] transition-colors"
      >
        Clear all filters
      </a>
    </div>
  )
}

function RecipesPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#FCFFEB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1
            className="text-3xl sm:text-4xl font-bold text-[#201D20] mb-6"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Search for a recipe or browse by category
          </h1>
        </div>

        {/* Search */}
        <div className="mb-8">
          <Suspense>
            <RecipeFilters />
          </Suspense>
        </div>

        {/* Recipe grid + pagination */}
        {children}
      </div>
    </main>
  )
}
