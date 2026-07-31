import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Clock, ChefHat, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { IngredientsCard } from '@/components/recipes/IngredientsCard'
import { InstructionsSection } from '@/components/recipes/RecipeInstructionsSection'
import type { Recipe, RecipeCategory } from '@/lib/database.types'

export const revalidate = 3600

type Props = {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('recipes')
    .select('title, seo_title, image_url')
    .eq('slug', slug)
    .eq('published', true)
    .single() as { data: Pick<Recipe, 'title' | 'seo_title' | 'image_url'> | null; error: unknown }

  if (!data) return {}

  const title = `Gluten-Free ${data.seo_title ?? data.title}`
  return {
    title,
    openGraph: {
      title,
      images: data.image_url ? [data.image_url] : [],
    },
  }
}

const difficultyConfig = {
  beginner: { label: 'Beginner', className: 'bg-[#EEF3EA] text-[#41622D]' },
  intermediate: { label: 'Intermediate', className: 'bg-amber-100 text-amber-800' },
  advanced: { label: 'Advanced', className: 'bg-red-100 text-red-800' },
}

export default async function GlutenFreeVariantPage({ params }: Props) {
  const { category, slug } = await params
  const supabase = await createClient()

  const { data: recipeData } = await supabase
    .from('recipes')
    .select('*, recipe_categories(slug, name)')
    .eq('slug', slug)
    .eq('published', true)
    .single() as { data: (Recipe & { recipe_categories: Pick<RecipeCategory, 'slug' | 'name'> | null }) | null; error: unknown }

  if (!recipeData) notFound()

  // Validate category segment
  const actualCategorySlug = recipeData.recipe_categories?.slug
  if (actualCategorySlug && actualCategorySlug !== category) {
    notFound()
  }

  // Redirect to standard recipe if GF variant not available
  if (!recipeData.has_gluten_free) {
    redirect(`/recipes/${category}/${slug}`)
  }

  const recipe = recipeData
  const difficulty = difficultyConfig[recipe.difficulty]
  const ingredients = recipe.gluten_free_ingredients ?? recipe.ingredients
  const instructions = recipe.gluten_free_instructions ?? recipe.instructions

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: `Gluten-Free ${recipe.title}`,
    description: recipe.gluten_free_notes ?? recipe.headline ?? undefined,
    image: recipe.image_url ?? undefined,
    totalTime: `PT${recipe.total_time_minutes}M`,
    suitableForDiet: 'https://schema.org/GlutenFreeDiet',
    recipeIngredient: ingredients.map(
      (i) => `${i.quantity} ${i.unit} ${i.ingredient_name}`.trim()
    ),
    recipeInstructions: instructions.map((step) => ({
      '@type': 'HowToStep',
      position: step.step_number,
      name: step.title ?? `Step ${step.step_number}`,
      text: step.body,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#FCFFEB]">
        {/* Hero */}
        <div className="relative bg-[#201D20] text-white overflow-hidden">
          <div className="absolute inset-0">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt={recipe.image_alt ?? recipe.title}
                fill
                className="object-cover opacity-25"
                priority
                sizes="100vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/50 to-[#201D20]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#201D20] via-[#201D20]/50 to-transparent" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
              <Link href="/recipes" className="hover:text-white transition-colors">Recipes</Link>
              {recipe.recipe_categories && (
                <>
                  <span>/</span>
                  <Link href={`/recipes/${recipe.recipe_categories.slug}`} className="hover:text-white transition-colors">
                    {recipe.recipe_categories.name}
                  </Link>
                </>
              )}
              <span>/</span>
              <Link href={`/recipes/${category}/${slug}`} className="hover:text-white transition-colors">
                {recipe.title}
              </Link>
              <span>/</span>
              <span className="text-white/80">Gluten-Free</span>
            </nav>

            {/* Variant badge */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#DCE8D5] text-[#2D4520]">
                Gluten-Free Variant
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${difficulty.className}`}>
                <ChefHat className="w-3.5 h-3.5" aria-hidden="true" />
                {difficulty.label}
              </span>
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Gluten-Free {recipe.title}
            </h1>

            {recipe.headline && (
              <p className="text-xl text-white/80 leading-relaxed mb-6">{recipe.headline}</p>
            )}

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" aria-hidden="true" />
                {recipe.total_time_minutes} min total
              </span>
              {recipe.base_servings != null && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" aria-hidden="true" />
                  {recipe.base_yield ?? `${recipe.base_servings} servings`}
                </span>
              )}
            </div>

            {/* Variant link */}
            <div className="mt-6">
              <Link
                href={`/recipes/${category}/${slug}`}
                className="text-sm text-white/60 hover:text-white underline transition-colors"
              >
                View standard recipe
              </Link>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* GF notes */}
          {recipe.gluten_free_notes && (
            <div className="mb-10 p-5 bg-[#EEF3EA] rounded-xl border-l-4 border-[#41622D]">
              <p className="text-sm text-[#1E2E14] leading-relaxed">{recipe.gluten_free_notes}</p>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar: ingredients (desktop) */}
            <aside className="hidden lg:block lg:w-72 shrink-0">
              <div className="sticky top-6">
                <IngredientsCard
                  ingredients={ingredients}
                  baseYield={recipe.base_yield}
                  baseServings={recipe.base_servings}
                  headerClassName="bg-[#EEF3EA]"
                />
              </div>
            </aside>

            {/* Main column */}
            <div className="flex-1 min-w-0 space-y-12">
              {/* Mobile ingredients */}
              <div className="lg:hidden">
                <IngredientsCard
                  ingredients={ingredients}
                  baseYield={recipe.base_yield}
                  baseServings={recipe.base_servings}
                  headerClassName="bg-[#EEF3EA]"
                />
              </div>

              <InstructionsSection instructions={instructions} />

              {/* Tips */}
              {recipe.tips && recipe.tips.length > 0 && (
                <section aria-labelledby="tips-heading">
                  <h2
                    id="tips-heading"
                    className="text-2xl font-bold text-[#201D20] mb-5"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Baker&apos;s Tips
                  </h2>
                  <ul className="space-y-3">
                    {recipe.tips.map((tip, i) => (
                      <li key={i} className="flex gap-3 bg-[#F5EAC8] rounded-xl p-4">
                        <span className="text-[#C58930] font-bold text-sm mt-0.5 shrink-0">{i + 1}.</span>
                        <p className="text-sm text-[#201D20] leading-relaxed">{tip}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-sm text-[#6D5E6D] bg-white border border-[#EBD2AD]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
