import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RecipeCard from '@/components/recipes/RecipeCard'
import type { Recipe } from '@/lib/database.types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Gluten-Free Recipes',
  description:
    'Browse our collection of gluten-free baking recipes — all the flavour, none of the gluten.',
}

type RecipeWithCategory = Pick<
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
> & { recipe_categories: { slug: string } | null }

export default async function GlutenFreeRecipesPage() {
  const supabase = await createClient()

  const { data: recipesData } = await supabase
    .from('recipes')
    .select(
      'id, slug, title, headline, image_url, difficulty, total_time_minutes, tags, has_gluten_free, has_high_protein, recipe_categories(slug)'
    )
    .eq('published', true)
    .eq('has_gluten_free', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  const recipes = (recipesData ?? []) as unknown as RecipeWithCategory[]

  return (
    <main className="min-h-screen bg-[#FCFFEB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <nav className="mb-4 flex items-center gap-2 text-sm text-[#6D5E6D]">
            <Link href="/recipes" className="hover:text-[#C58930] transition-colors">Recipes</Link>
            <span>/</span>
            <span>Gluten-Free</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#DCE8D5] text-[#2D4520]">
              Gluten-Free
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl font-bold text-[#201D20] mb-3"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Gluten-Free Recipes
          </h1>
          <p className="text-lg text-[#6D5E6D]">
            All the flavour, none of the gluten. {recipes.length}{' '}
            {recipes.length === 1 ? 'recipe' : 'recipes'} available.
          </p>
        </div>

        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                categorySlug={recipe.recipe_categories?.slug}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4">
            <p className="text-5xl" aria-hidden="true">🌾</p>
            <h2
              className="text-2xl font-semibold text-[#201D20]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              No gluten-free recipes yet
            </h2>
            <p className="text-[#6D5E6D]">We&apos;re working on it — check back soon!</p>
            <Link
              href="/recipes"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#C58930] text-white font-medium hover:bg-[#A87225] transition-colors"
            >
              Browse all recipes
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
