import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RecipeCard from '@/components/recipes/RecipeCard'
import RecipeFilters from '@/components/recipes/RecipeFilters'
import type { Recipe, RecipeCategory, RecipeSubcategory } from '@/lib/database.types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Recipes',
  description: 'Browse our full collection of baking recipes — from beginner-friendly breads to advanced pastries.',
}

const PAGE_SIZE = 24

const HOLIDAYS: { label: string; tag: string }[] = [
  { label: 'New Year\'s', tag: 'new-years' },
  { label: 'Valentine\'s Day', tag: 'valentines-day' },
  { label: 'St. Patrick\'s Day', tag: 'st-patricks-day' },
  { label: 'Easter', tag: 'easter' },
  { label: 'Passover', tag: 'passover' },
  { label: 'Cinco de Mayo', tag: 'cinco-de-mayo' },
  { label: 'Mother\'s Day', tag: 'mothers-day' },
  { label: 'Father\'s Day', tag: 'fathers-day' },
  { label: '4th of July', tag: '4th-of-july' },
  { label: 'Rosh Hashanah & Yom Kippur', tag: 'rosh-hashanah-yom-kippur' },
  { label: 'Halloween', tag: 'halloween' },
  { label: 'Día de los Muertos', tag: 'dia-de-los-muertos' },
  { label: 'Thanksgiving', tag: 'thanksgiving' },
  { label: 'Hanukkah', tag: 'hanukkah' },
  { label: 'Christmas', tag: 'christmas' },
  { label: 'Kwanzaa', tag: 'kwanzaa' },
  { label: 'Eid al-Fitr', tag: 'eid-al-fitr' },
  { label: 'Diwali', tag: 'diwali' },
]

const SEASONS: { label: string; tag: string }[] = [
  { label: 'Spring', tag: 'spring' },
  { label: 'Summer', tag: 'summer' },
  { label: 'Fall', tag: 'fall' },
  { label: 'Winter', tag: 'winter' },
]

type SearchParams = Promise<{ q?: string; occasion?: string; page?: string }>

export default async function RecipesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()

  // Always fetch categories + subcategories for the browse view
  const [{ data: categoriesData }, { data: subcategoriesData }] = await Promise.all([
    supabase.from('recipe_categories').select('id, slug, name, description, image_url, sort_order, created_at').order('sort_order'),
    supabase.from('recipe_subcategories').select('id, category_id, slug, name, description, sort_order, created_at').order('sort_order'),
  ])
  const categories = (categoriesData ?? []) as RecipeCategory[]
  const subcategories = (subcategoriesData ?? []) as RecipeSubcategory[]

  // Browse view — no search or occasion filter
  if (!params.q && !params.occasion) {
    return (
      <PageShell>
        <CategoryBrowser categories={categories} subcategories={subcategories} />
      </PageShell>
    )
  }

  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // ── Occasion/holiday filter ──────────────────────────────────────────────
  if (params.occasion) {
    const occasionLabel =
      [...HOLIDAYS, ...SEASONS].find((h) => h.tag === params.occasion)?.label ?? params.occasion

    const { data: recipesData, count } = await supabase
      .from('recipes')
      .select('id, slug, title, headline, image_url, difficulty, total_time_minutes, tags, has_gluten_free, has_high_protein, category_id, recipe_categories(slug)', { count: 'exact' })
      .eq('published', true)
      .contains('occasion_tags', [params.occasion])
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
          {totalCount} recipe{totalCount !== 1 ? 's' : ''} for{' '}
          <span className="font-medium text-[#201D20]">{occasionLabel}</span>
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
                <a href={`/recipes?occasion=${params.occasion}&page=${page + 1}`} className="px-6 py-3 rounded-xl bg-[#C58930] text-white font-medium hover:bg-[#A87225] transition-colors">
                  Load more
                </a>
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </PageShell>
    )
  }

  // ── Text search ──────────────────────────────────────────────────────────
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
              <a href={`/recipes?q=${encodeURIComponent(params.q!)}&page=${page + 1}`} className="px-6 py-3 rounded-xl bg-[#C58930] text-white font-medium hover:bg-[#A87225] transition-colors">
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

// ─── Category browser ────────────────────────────────────────────────────────

function CategoryBrowser({ categories, subcategories }: { categories: RecipeCategory[]; subcategories: RecipeSubcategory[] }) {
  const subsByCategory = subcategories.reduce<Record<string, RecipeSubcategory[]>>((acc, sub) => {
    if (!acc[sub.category_id]) acc[sub.category_id] = []
    acc[sub.category_id].push(sub)
    return acc
  }, {})

  return (
    <div className="space-y-12">
      {categories.map((cat) => {
        const subs = subsByCategory[cat.id] ?? []
        return (
          <div key={cat.id}>
            <Link href={`/recipes/${cat.slug}`} className="group inline-flex items-baseline gap-2 mb-5">
              <h2
                className="text-2xl font-bold text-[#201D20] group-hover:text-[#C58930] transition-colors duration-150"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {cat.name}
              </h2>
              <span className="text-sm text-[#C58930] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                View all →
              </span>
            </Link>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {subs.length > 0 ? subs.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/recipes/${cat.slug}?sub=${sub.slug}`}
                  className="group block rounded-xl border border-[#EBD2AD] bg-white px-5 py-4 hover:border-[#C58930] hover:shadow-sm hover:shadow-[#C58930]/10 transition-all duration-150"
                >
                  <p className="font-semibold text-[#201D20] group-hover:text-[#C58930] transition-colors duration-150 leading-snug" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {sub.name}
                  </p>
                  {sub.description && (
                    <p className="mt-1 text-xs text-[#6D5E6D] line-clamp-2 leading-relaxed">{sub.description}</p>
                  )}
                </Link>
              )) : (
                <Link
                  href={`/recipes/${cat.slug}`}
                  className="group block rounded-xl border border-[#EBD2AD] bg-white px-5 py-4 hover:border-[#C58930] hover:shadow-sm transition-all duration-150"
                >
                  <p className="font-semibold text-[#201D20] group-hover:text-[#C58930] transition-colors duration-150" style={{ fontFamily: 'var(--font-playfair)' }}>
                    All {cat.name}
                  </p>
                </Link>
              )}
            </div>
          </div>
        )
      })}

      {/* Seasonal & Holiday */}
      <div>
        <h2
          className="text-2xl font-bold text-[#201D20] mb-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Seasonal & Holiday
        </h2>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6D5E6D] mb-3 mt-5">By Season</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {SEASONS.map((s) => (
            <Link
              key={s.tag}
              href={`/recipes?occasion=${s.tag}`}
              className="group block rounded-xl border border-[#EBD2AD] bg-white px-5 py-4 hover:border-[#C58930] hover:shadow-sm hover:shadow-[#C58930]/10 transition-all duration-150"
            >
              <p className="font-semibold text-[#201D20] group-hover:text-[#C58930] transition-colors duration-150" style={{ fontFamily: 'var(--font-playfair)' }}>
                {s.label}
              </p>
            </Link>
          ))}
        </div>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6D5E6D] mb-3">Holidays</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {HOLIDAYS.map((h) => (
            <Link
              key={h.tag}
              href={`/recipes?occasion=${h.tag}`}
              className="group block rounded-xl border border-[#EBD2AD] bg-white px-5 py-4 hover:border-[#C58930] hover:shadow-sm hover:shadow-[#C58930]/10 transition-all duration-150"
            >
              <p className="font-semibold text-[#201D20] group-hover:text-[#C58930] transition-colors duration-150" style={{ fontFamily: 'var(--font-playfair)' }}>
                {h.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
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
