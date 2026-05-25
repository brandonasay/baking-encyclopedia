import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RecipeCard from '@/components/recipes/RecipeCard'
import RecipeFilters from '@/components/recipes/RecipeFilters'
import type { Recipe, RecipeCategory } from '@/lib/database.types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Recipes',
  description: 'Browse our full collection of baking recipes — from beginner-friendly breads to advanced pastries.',
}

const PAGE_SIZE = 24

type SearchParams = Promise<{ q?: string; page?: string }>

export default async function RecipesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()

  // Always fetch categories for the browse view
  const { data: categoriesData } = await supabase
    .from('recipe_categories')
    .select('id, slug, name, description, image_url, sort_order, created_at')
    .order('sort_order')
  const categories = (categoriesData ?? []) as RecipeCategory[]

  // No search query — show category browse
  if (!params.q) {
    return (
      <PageShell>
        <CategoryGrid categories={categories} />
      </PageShell>
    )
  }

  // Search query — show results
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: searchResults } = await (supabase as any).rpc('search_all', {
    query: params.q,
    result_limit: 100,
  })
  const typed = (searchResults ?? []) as { id: string; content_type: string }[]
  const searchResultIds = typed.filter((r) => r.content_type === 'recipe').map((r) => r.id)

  if (searchResultIds.length === 0) {
    return (
      <PageShell>
        <EmptyState query={params.q} />
      </PageShell>
    )
  }

  const { data: recipesData, count } = await supabase
    .from('recipes')
    .select('id, slug, title, headline, image_url, difficulty, total_time_minutes, tags, has_gluten_free, has_high_protein, category_id, recipe_categories(slug)', { count: 'exact' })
    .eq('published', true)
    .in('id', searchResultIds)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  type RecipeCardFields = Pick<Recipe, 'id' | 'slug' | 'title' | 'headline' | 'image_url' | 'difficulty' | 'total_time_minutes' | 'tags' | 'has_gluten_free' | 'has_high_protein'> & { recipe_categories?: { slug: string } | null }
  const recipes = (recipesData ?? []) as unknown as RecipeCardFields[]
  const totalCount = count ?? 0
  const hasMore = to < totalCount - 1

  return (
    <PageShell>
      <p className="text-sm text-[#6D5E6D] mb-6">
        {totalCount} result{totalCount !== 1 ? 's' : ''} for{' '}
        <span className="font-medium text-[#201D20]">&ldquo;{params.q}&rdquo;</span>
      </p>

      {recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} categorySlug={(recipe as any).recipe_categories?.slug} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-12 flex justify-center">
              <a
                href={`/recipes?q=${encodeURIComponent(params.q)}&page=${page + 1}`}
                className="px-6 py-3 rounded-xl bg-[#C58930] text-white font-medium hover:bg-[#A87225] transition-colors"
              >
                Load more
              </a>
            </div>
          )}
        </>
      ) : (
        <EmptyState query={params.q} />
      )}
    </PageShell>
  )
}

// ─── Category grid ───────────────────────────────────────────────────────────

function CategoryGrid({ categories }: { categories: RecipeCategory[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/recipes/${cat.slug}`}
          className="group block rounded-2xl border border-[#EBD2AD] bg-[var(--color-surface)] p-6 hover:border-[#C58930] hover:shadow-md hover:shadow-[#C58930]/10 transition-all duration-150"
        >
          <p
            className="text-lg font-bold text-[#201D20] group-hover:text-[#C58930] transition-colors duration-150 leading-snug"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {cat.name}
          </p>
          {cat.description && (
            <p className="mt-1.5 text-sm text-[#6D5E6D] line-clamp-2 leading-relaxed">
              {cat.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}

// ─── Shell ───────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#FCFFEB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#201D20] mb-6"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Search for a recipe or browse by category
        </h1>
        <div className="mb-10">
          <Suspense>
            <RecipeFilters />
          </Suspense>
        </div>
        {children}
      </div>
    </main>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ query }: { query?: string }) {
  return (
    <div className="py-20 text-center space-y-4">
      <p className="text-5xl" aria-hidden="true">🥐</p>
      <h2 className="text-2xl font-semibold text-[#201D20]" style={{ fontFamily: 'var(--font-playfair)' }}>
        No recipes found
      </h2>
      <p className="text-[#6D5E6D] max-w-sm mx-auto">
        {query ? `No results for "${query}". Try a different search.` : 'Nothing here yet.'}
      </p>
      <a href="/recipes" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#C58930] text-white font-medium hover:bg-[#A87225] transition-colors">
        Back to browse
      </a>
    </div>
  )
}
