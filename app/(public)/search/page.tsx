import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SearchBar from '@/components/search/SearchBar'
import RecipeCard from '@/components/recipes/RecipeCard'
import HowToCard from '@/components/howto/HowToCard'
import IngredientCard from '@/components/ingredients/IngredientCard'
import type { SearchResult } from '@/lib/database.types'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search recipes, ingredients, and how-to guides across the Baking Encyclopedia.',
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const SUGGESTIONS = [
  { label: 'Sourdough', href: '/search?q=sourdough' },
  { label: 'Croissants', href: '/search?q=croissants' },
  { label: 'Butter', href: '/search?q=butter' },
  { label: 'Lamination', href: '/search?q=lamination' },
  { label: 'Bread flour', href: '/search?q=bread+flour' },
  { label: 'Pricing', href: '/search?q=pricing' },
]

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = typeof q === 'string' ? q.trim() : ''

  let results: SearchResult[] = []
  let error = false

  if (query) {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: rpcError } = await (supabase as any).rpc('search_all', {
      query,
      result_limit: 30,
    }) as { data: SearchResult[] | null; error: unknown }
    if (rpcError) {
      error = true
    } else {
      results = data ?? []
    }
  }

  // Group results by content_type
  const recipes = results.filter((r) => r.content_type === 'recipe')
  const ingredients = results.filter((r) => r.content_type === 'ingredient')
  const howtos = results.filter((r) => r.content_type === 'howto')

  const totalCount = results.length

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E0D5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          {query ? (
            <h1
              className="text-3xl md:text-4xl text-[#1C1410] mb-6"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Results for &ldquo;{query}&rdquo;
            </h1>
          ) : (
            <>
              <p className="text-[#C8652A] text-sm font-medium uppercase tracking-widest mb-3">
                Search
              </p>
              <h1
                className="text-4xl md:text-5xl text-[#1C1410] mb-4"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Find anything
              </h1>
              <p className="text-[#7A6A5E] text-lg mb-8">
                Search across recipes, ingredients, and how-to guides.
              </p>
            </>
          )}

          <Suspense fallback={null}>
            <SearchBar defaultValue={query} autoFocus={!query} />
          </Suspense>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-[#7A6A5E]">Something went wrong. Please try again.</p>
          </div>
        )}

        {/* No query — show suggestions */}
        {!query && !error && (
          <div>
            <h2
              className="text-xl text-[#1C1410] mb-5"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Popular topics
            </h2>
            <div className="flex flex-wrap gap-3">
              {SUGGESTIONS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="px-4 py-2 rounded-full bg-white border border-[#E8E0D5] text-[#7A6A5E] text-sm hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {query && !error && totalCount === 0 && (
          <div className="text-center py-16">
            <p
              className="text-2xl text-[#1C1410] mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-[#7A6A5E] mb-8">Try a different term, or explore these topics:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {SUGGESTIONS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="px-4 py-2 rounded-full bg-white border border-[#E8E0D5] text-[#7A6A5E] text-sm hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && totalCount > 0 && (
          <div className="space-y-14">
            <p className="text-sm text-[#7A6A5E] -mt-2 mb-6">
              {totalCount} result{totalCount === 1 ? '' : 's'}
            </p>

            {/* Recipes */}
            {recipes.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2
                    className="text-2xl text-[#1C1410]"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Recipes
                  </h2>
                  <div className="flex-1 h-px bg-[#E8E0D5]" />
                  <span className="text-sm text-[#7A6A5E]">{recipes.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recipes.map((result) => (
                    <SearchRecipeCard key={result.id} result={result} />
                  ))}
                </div>
              </section>
            )}

            {/* Ingredients */}
            {ingredients.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2
                    className="text-2xl text-[#1C1410]"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Ingredients
                  </h2>
                  <div className="flex-1 h-px bg-[#E8E0D5]" />
                  <span className="text-sm text-[#7A6A5E]">{ingredients.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {ingredients.map((result) => (
                    <SearchIngredientCard key={result.id} result={result} />
                  ))}
                </div>
              </section>
            )}

            {/* How-to articles */}
            {howtos.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2
                    className="text-2xl text-[#1C1410]"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    How-To Guides
                  </h2>
                  <div className="flex-1 h-px bg-[#E8E0D5]" />
                  <span className="text-sm text-[#7A6A5E]">{howtos.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {howtos.map((result) => (
                    <SearchHowToCard key={result.id} result={result} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Lightweight cards built from SearchResult shape (no full row fetch needed)
function SearchRecipeCard({ result }: { result: SearchResult }) {
  return (
    <Link href={`/recipes/${result.slug}`} className="group block h-full">
      <article className="bg-white rounded-xl overflow-hidden border border-[#E8E0D5] h-full flex flex-col transition-shadow duration-200 hover:shadow-lg hover:shadow-[#C8652A]/10">
        {result.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image_url}
            alt={result.title}
            className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#F5EDE4] to-[#E8D5C4] flex items-end p-4">
            <span
              className="text-[#7A6A5E] text-sm line-clamp-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {result.title}
            </span>
          </div>
        )}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3
            className="text-lg leading-snug text-[#1C1410] line-clamp-2 group-hover:text-[#C8652A] transition-colors"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {result.title}
          </h3>
          {result.headline && (
            <p className="text-sm text-[#7A6A5E] line-clamp-2 leading-relaxed">{result.headline}</p>
          )}
        </div>
      </article>
    </Link>
  )
}

function SearchIngredientCard({ result }: { result: SearchResult }) {
  return (
    <Link href={`/ingredients/${result.slug}`} className="group block h-full">
      <article className="bg-white rounded-xl overflow-hidden border border-[#E8E0D5] h-full flex flex-col transition-shadow duration-200 hover:shadow-lg hover:shadow-[#C8652A]/10">
        {result.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image_url}
            alt={result.title}
            className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#F5EDE4] to-[#E8D5C4] flex items-end p-4">
            <span
              className="text-[#7A6A5E] text-sm line-clamp-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {result.title}
            </span>
          </div>
        )}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3
            className="text-lg leading-snug text-[#1C1410] line-clamp-2 group-hover:text-[#C8652A] transition-colors"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {result.title}
          </h3>
          {result.headline && (
            <p className="text-sm text-[#7A6A5E] line-clamp-2 leading-relaxed">{result.headline}</p>
          )}
        </div>
      </article>
    </Link>
  )
}

function SearchHowToCard({ result }: { result: SearchResult }) {
  return (
    <Link href={`/how-to/${result.slug}`} className="group block h-full">
      <article className="bg-white rounded-xl overflow-hidden border border-[#E8E0D5] h-full flex flex-col transition-shadow duration-200 hover:shadow-lg hover:shadow-[#C8652A]/10">
        {result.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image_url}
            alt={result.title}
            className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#F5EDE4] to-[#E8D5C4] flex items-end p-4">
            <span
              className="text-[#7A6A5E] text-sm line-clamp-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {result.title}
            </span>
          </div>
        )}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3
            className="text-lg leading-snug text-[#1C1410] line-clamp-2 group-hover:text-[#C8652A] transition-colors"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {result.title}
          </h3>
          {result.headline && (
            <p className="text-sm text-[#7A6A5E] line-clamp-2 leading-relaxed">{result.headline}</p>
          )}
        </div>
      </article>
    </Link>
  )
}
