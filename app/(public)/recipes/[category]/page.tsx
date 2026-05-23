import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecipeCard from '@/components/recipes/RecipeCard'
import type { Recipe, RecipeCategory } from '@/lib/database.types'

export const revalidate = 3600

type Props = {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('recipe_categories')
    .select('name, description')
    .eq('slug', category)
    .single() as { data: Pick<RecipeCategory, 'name' | 'description'> | null; error: unknown }

  if (!data) return {}

  return {
    title: `${data.name} Recipes`,
    description:
      data.description ??
      `Browse our collection of ${data.name.toLowerCase()} recipes.`,
  }
}

type RecipeCardFields = Pick<
  Recipe,
  | 'id'
  | 'slug'
  | 'title'
  | 'headline'
  | 'image_url'
  | 'difficulty'
  | 'total_time_minutes'
  | 'tags'
  | 'has_gluten_free'
  | 'has_high_protein'
>

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const supabase = await createClient()

  const { data: cat } = await supabase
    .from('recipe_categories')
    .select('id, slug, name, description, image_url')
    .eq('slug', category)
    .single() as {
    data: Pick<RecipeCategory, 'id' | 'slug' | 'name' | 'description' | 'image_url'> | null
    error: unknown
  }

  if (!cat) notFound()

  const { data: recipesData } = await supabase
    .from('recipes')
    .select(
      'id, slug, title, headline, image_url, difficulty, total_time_minutes, tags, has_gluten_free, has_high_protein'
    )
    .eq('category_id', cat.id)
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  const recipes = (recipesData ?? []) as RecipeCardFields[]

  return (
    <main className="min-h-screen bg-[#FAF8F4]">
      {/* Category hero */}
      <div className="relative bg-[#1C1410] text-white overflow-hidden">
        {cat.image_url ? (
          <div className="absolute inset-0">
            <Image
              src={cat.image_url}
              alt={cat.name}
              fill
              className="object-cover opacity-20"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] via-[#1C1410]/60 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#C8652A]/40 to-[#1C1410]" />
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <nav className="mb-4 flex items-center gap-2 text-sm text-white/60">
            <Link href="/recipes" className="hover:text-white transition-colors">
              Recipes
            </Link>
            <span>/</span>
            <span className="text-white/80">{cat.name}</span>
          </nav>

          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-3"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {cat.name}
          </h1>

          {cat.description && (
            <p className="text-lg text-white/80 max-w-2xl leading-relaxed">{cat.description}</p>
          )}

          <p className="mt-4 text-sm text-white/60">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>
      </div>

      {/* Recipe grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} categorySlug={cat.slug} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4">
            <p className="text-5xl" aria-hidden="true">🥐</p>
            <h2
              className="text-2xl font-semibold text-[#1C1410]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              No recipes yet
            </h2>
            <p className="text-[#7A6A5E]">
              We&apos;re working on {cat.name.toLowerCase()} recipes — check back soon!
            </p>
            <Link
              href="/recipes"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#C8652A] text-white font-medium hover:bg-[#B55A24] transition-colors"
            >
              Browse all recipes
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
