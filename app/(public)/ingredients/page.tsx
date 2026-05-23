import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600
import IngredientCard from '@/components/ingredients/IngredientCard'
import IngredientSearchBar from '@/components/ingredients/IngredientSearchBar'
import type { Ingredient } from '@/lib/database.types'

export const metadata: Metadata = {
  title: 'Ingredients Encyclopedia',
  description:
    'A comprehensive reference for baking ingredients — how they work, storage tips, substitutes, and more.',
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function IngredientsPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = typeof q === 'string' ? q.toLowerCase().trim() : ''

  const supabase = await createClient()
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, slug, name, category, headline, image_url')
    .eq('published', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  const allIngredients = (ingredients ?? []) as Pick<
    Ingredient,
    'slug' | 'name' | 'category' | 'headline' | 'image_url'
  >[]

  const filtered = query
    ? allIngredients.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.category.toLowerCase().includes(query) ||
          (i.headline ?? '').toLowerCase().includes(query)
      )
    : allIngredients

  // Group by category
  const grouped = filtered.reduce<
    Record<string, typeof filtered>
  >((acc, ingredient) => {
    const cat = ingredient.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ingredient)
    return acc
  }, {})

  const categories = Object.keys(grouped).sort()

  // A–Z letters that have ingredients
  const letters = Array.from(
    new Set(filtered.map((i) => i.name[0]?.toUpperCase() ?? '#'))
  ).sort()

  return (
    <div className="min-h-screen bg-[#FCFFEB]">
      {/* Hero */}
      <div className="bg-white border-b border-[#EBD2AD]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-[#C58930] text-sm font-medium uppercase tracking-widest mb-3">
            Reference
          </p>
          <h1
            className="text-4xl md:text-5xl text-[#201D20] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Ingredients Encyclopedia
          </h1>
          <p className="text-[#6D5E6D] text-lg max-w-2xl leading-relaxed mb-8">
            Deep-dive profiles for every ingredient a baker reaches for — how they work, where they
            come from, and how to swap them.
          </p>

          {/* Search bar — wrapped in Suspense because it reads searchParams internally */}
          <Suspense fallback={null}>
            <IngredientSearchBar defaultValue={query} />
          </Suspense>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* A–Z quick jump */}
        {!query && letters.length > 0 && (
          <nav aria-label="Jump to letter" className="mb-10">
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
                const active = letters.includes(letter)
                return (
                  <a
                    key={letter}
                    href={active ? `#letter-${letter}` : undefined}
                    aria-disabled={!active}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white border border-[#EBD2AD] text-[#201D20] hover:border-[#C58930] hover:text-[#C58930]'
                        : 'text-[#6D5E6D]/40 cursor-default'
                    }`}
                  >
                    {letter}
                  </a>
                )
              })}
            </div>
          </nav>
        )}

        {/* Query result header */}
        {query && (
          <p className="text-[#6D5E6D] mb-8 text-sm">
            {filtered.length === 0
              ? `No ingredients found for "${q}"`
              : `${filtered.length} ingredient${filtered.length === 1 ? '' : 's'} matching "${q}"`}
          </p>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#6D5E6D] text-lg">No ingredients found.</p>
            <p className="text-[#6D5E6D] text-sm mt-2">Try a different search term.</p>
          </div>
        )}

        {/* Category sections */}
        {categories.map((category) => {
          const firstLetter = grouped[category][0]?.name[0]?.toUpperCase()
          return (
            <section
              key={category}
              id={firstLetter ? `letter-${firstLetter}` : undefined}
              className="mb-14"
            >
              <div className="flex items-center gap-4 mb-6">
                <h2
                  className="text-2xl text-[#201D20]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {category}
                </h2>
                <div className="flex-1 h-px bg-[#EBD2AD]" />
                <span className="text-sm text-[#6D5E6D]">
                  {grouped[category].length} ingredient{grouped[category].length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {grouped[category].map((ingredient) => (
                  <IngredientCard key={ingredient.slug} ingredient={ingredient} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
