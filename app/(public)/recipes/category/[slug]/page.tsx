import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecipeCard from '@/components/recipes/RecipeCard'
import type { RecipeCategory, Recipe } from '@/lib/database.types'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: categoryData } = await supabase
    .from('recipe_categories')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!categoryData) return { title: 'Category Not Found' }

  const category = categoryData as Pick<RecipeCategory, 'name' | 'description'>

  return {
    title: `${category.name} Recipes`,
    description:
      category.description ??
      `Browse all ${category.name.toLowerCase()} recipes in the Baking Encyclopedia.`,
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch category
  const { data: categoryData } = await supabase
    .from('recipe_categories')
    .select('id, slug, name, description, image_url, sort_order, created_at')
    .eq('slug', slug)
    .single()

  if (!categoryData) notFound()

  const category = categoryData as RecipeCategory

  // Fetch recipes in this category
  const { data: recipesData, count } = await supabase
    .from('recipes')
    .select(
      'id, slug, title, headline, image_url, difficulty, total_time_minutes, tags, has_gluten_free, has_high_protein',
      { count: 'exact' }
    )
    .eq('category_id', category.id)
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  type RecipeCardFields = Pick<Recipe, 'id' | 'slug' | 'title' | 'headline' | 'image_url' | 'difficulty' | 'total_time_minutes' | 'tags' | 'has_gluten_free' | 'has_high_protein'>
  const recipes = (recipesData ?? []) as RecipeCardFields[]
  const totalCount = count ?? 0

  return (
    <main className="min-h-screen bg-[#FAF8F4]">
      {/* Category hero */}
      <div className="relative w-full h-56 sm:h-72 bg-[#E8D5C4] overflow-hidden">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5EDE4] to-[#C8652A]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-5xl">
          {/* Breadcrumb */}
          <nav
            className="mb-3 flex items-center gap-2 text-white/70 text-sm"
            aria-label="Breadcrumb"
          >
            <Link href="/recipes" className="hover:text-white transition-colors">
              Recipes
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-white/90">{category.name}</span>
          </nav>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {category.name}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Description + count */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            {category.description && (
              <p className="text-lg text-[#7A6A5E] leading-relaxed">{category.description}</p>
            )}
          </div>
          <p className="flex-shrink-0 text-sm text-[#7A6A5E]">
            {totalCount} recipe{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Recipe grid */}
        {recipes && recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <p className="text-5xl" aria-hidden="true">
              🥐
            </p>
            <h2
              className="text-2xl font-semibold text-[#1C1410]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              No recipes yet
            </h2>
            <p className="text-[#7A6A5E] max-w-sm mx-auto">
              We&rsquo;re still adding recipes to this category. Check back soon!
            </p>
            <Link
              href="/recipes"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#C8652A] text-white font-medium hover:bg-[#B55A24] transition-colors"
            >
              Browse all recipes
            </Link>
          </div>
        )}

        {/* Browse other categories CTA */}
        <div className="mt-16 pt-10 border-t border-[#E8E0D5] text-center">
          <p className="text-[#7A6A5E] mb-4">Looking for something else?</p>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E8E0D5] bg-white text-[#1C1410] font-medium hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
          >
            Browse all recipes
          </Link>
        </div>
      </div>
    </main>
  )
}
