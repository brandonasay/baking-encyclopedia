import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, ChefHat, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import RecipeVariantToggle from '@/components/recipes/RecipeVariantToggle'
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
    .select('title, headline, seo_title, seo_description, image_url')
    .eq('slug', slug)
    .eq('published', true)
    .single() as {
    data: Pick<Recipe, 'title' | 'headline' | 'seo_title' | 'seo_description' | 'image_url'> | null
    error: unknown
  }

  if (!data) return {}

  return {
    title: data.seo_title ?? data.title,
    description: data.seo_description ?? data.headline ?? undefined,
    openGraph: {
      title: data.seo_title ?? data.title,
      description: data.seo_description ?? data.headline ?? undefined,
      images: data.image_url ? [data.image_url] : [],
    },
  }
}

const difficultyConfig = {
  beginner: { label: 'Beginner', className: 'bg-[#EEF3EA] text-[#41622D]' },
  intermediate: { label: 'Intermediate', className: 'bg-amber-100 text-amber-800' },
  advanced: { label: 'Advanced', className: 'bg-red-100 text-red-800' },
}

export default async function RecipeDetailPage({ params }: Props) {
  const { category, slug } = await params
  const supabase = await createClient()

  // Fetch recipe + join category for breadcrumb
  const { data: recipeData } = await supabase
    .from('recipes')
    .select('*, recipe_categories(slug, name)')
    .eq('slug', slug)
    .eq('published', true)
    .single() as { data: (Recipe & { recipe_categories: Pick<RecipeCategory, 'slug' | 'name'> | null }) | null; error: unknown }

  if (!recipeData) notFound()

  // Validate the category segment matches the recipe's actual category
  const actualCategorySlug = recipeData.recipe_categories?.slug
  if (actualCategorySlug && actualCategorySlug !== category) {
    notFound()
  }

  const recipe = recipeData
  const difficulty = difficultyConfig[recipe.difficulty]

  const hasVariants = recipe.has_gluten_free || recipe.has_high_protein

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.headline ?? recipe.seo_description ?? undefined,
    image: recipe.image_url ?? undefined,
    totalTime: `PT${recipe.total_time_minutes}M`,
    prepTime: recipe.prep_time_minutes ? `PT${recipe.prep_time_minutes}M` : undefined,
    cookTime: recipe.cook_time_minutes ? `PT${recipe.cook_time_minutes}M` : undefined,
    recipeYield: recipe.base_yield ?? recipe.base_servings?.toString() ?? undefined,
    recipeIngredient: recipe.ingredients.map(
      (i) => `${i.quantity} ${i.unit} ${i.ingredient_name}`.trim()
    ),
    recipeInstructions: recipe.instructions.map((step) => ({
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
              <div className="absolute inset-0 bg-gradient-to-br from-[#C58930]/50 to-[#201D20]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#201D20] via-[#201D20]/50 to-transparent" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
              <Link href="/recipes" className="hover:text-white transition-colors">
                Recipes
              </Link>
              {recipe.recipe_categories && (
                <>
                  <span>/</span>
                  <Link
                    href={`/recipes/${recipe.recipe_categories.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {recipe.recipe_categories.name}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-white/80 truncate">{recipe.title}</span>
            </nav>

            {/* Difficulty badge */}
            <div className="mb-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${difficulty.className}`}
              >
                <ChefHat className="w-3.5 h-3.5" aria-hidden="true" />
                {difficulty.label}
              </span>
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {recipe.title}
            </h1>

            {recipe.headline && (
              <p className="text-xl text-white/80 leading-relaxed mb-8">{recipe.headline}</p>
            )}

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" aria-hidden="true" />
                {recipe.total_time_minutes} min total
              </span>
              {recipe.prep_time_minutes != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                  {recipe.prep_time_minutes} min prep
                </span>
              )}
              {recipe.base_servings != null && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" aria-hidden="true" />
                  {recipe.base_yield ?? `${recipe.base_servings} servings`}
                </span>
              )}
              {recipe.has_gluten_free && (
                <span className="px-2 py-0.5 rounded bg-[#2D4520]/60 text-[#B5C9A8] text-xs font-medium">
                  GF available
                </span>
              )}
              {recipe.has_high_protein && (
                <span className="px-2 py-0.5 rounded bg-blue-800/60 text-blue-200 text-xs font-medium">
                  HP available
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar: ingredients (desktop) */}
            <aside className="hidden lg:block lg:w-72 shrink-0">
              <div className="sticky top-6">
                <IngredientsCard
                  ingredients={recipe.ingredients}
                  baseYield={recipe.base_yield}
                  baseServings={recipe.base_servings}
                />
              </div>
            </aside>

            {/* Main column */}
            <div className="flex-1 min-w-0 space-y-12">
              {/* Variant toggle (shows mobile ingredients + instructions with variant tabs) */}
              {hasVariants ? (
                <RecipeVariantToggle
                  hasGlutenFree={recipe.has_gluten_free}
                  hasHighProtein={recipe.has_high_protein}
                  glutenFreeNotes={recipe.gluten_free_notes ?? undefined}
                  highProteinNotes={recipe.high_protein_notes ?? undefined}
                  baseIngredients={recipe.ingredients}
                  baseInstructions={recipe.instructions}
                  baseYield={recipe.base_yield}
                  baseServings={recipe.base_servings}
                  glutenFreeIngredients={recipe.gluten_free_ingredients ?? undefined}
                  glutenFreeInstructions={recipe.gluten_free_instructions ?? undefined}
                  highProteinIngredients={recipe.high_protein_ingredients ?? undefined}
                  highProteinInstructions={recipe.high_protein_instructions ?? undefined}
                />
              ) : (
                <>
                  {/* Mobile-only ingredients */}
                  <div className="lg:hidden">
                    <IngredientsCard
                      ingredients={recipe.ingredients}
                      baseYield={recipe.base_yield}
                      baseServings={recipe.base_servings}
                    />
                  </div>

                  {/* Instructions */}
                  <InstructionsSection instructions={recipe.instructions} />
                </>
              )}

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
                        <span className="text-[#C58930] font-bold text-sm mt-0.5 shrink-0">
                          {i + 1}.
                        </span>
                        <p className="text-sm text-[#201D20] leading-relaxed">{tip}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Equipment */}
              {recipe.equipment && recipe.equipment.length > 0 && (
                <section aria-labelledby="equipment-heading">
                  <h2
                    id="equipment-heading"
                    className="text-2xl font-bold text-[#201D20] mb-5"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Equipment
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {recipe.equipment.map((item) => (
                      <li
                        key={item}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#EBD2AD] text-sm text-[#201D20]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Storage */}
              {recipe.storage_instructions && (
                <section aria-labelledby="storage-heading">
                  <h2
                    id="storage-heading"
                    className="text-2xl font-bold text-[#201D20] mb-4"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Storage
                  </h2>
                  <div className="bg-white rounded-xl border border-[#EBD2AD] p-5">
                    <p className="text-[#201D20] leading-relaxed">{recipe.storage_instructions}</p>
                  </div>
                </section>
              )}

              {/* Nutrition */}
              {recipe.nutrition_per_serving && (
                <section aria-labelledby="nutrition-heading">
                  <h2
                    id="nutrition-heading"
                    className="text-2xl font-bold text-[#201D20] mb-5"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Nutrition per Serving
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {recipe.nutrition_per_serving.calories != null && (
                      <NutritionBadge label="Calories" value={recipe.nutrition_per_serving.calories} unit="" />
                    )}
                    {recipe.nutrition_per_serving.protein_g != null && (
                      <NutritionBadge label="Protein" value={recipe.nutrition_per_serving.protein_g} unit="g" />
                    )}
                    {recipe.nutrition_per_serving.carbs_g != null && (
                      <NutritionBadge label="Carbs" value={recipe.nutrition_per_serving.carbs_g} unit="g" />
                    )}
                    {recipe.nutrition_per_serving.fat_g != null && (
                      <NutritionBadge label="Fat" value={recipe.nutrition_per_serving.fat_g} unit="g" />
                    )}
                  </div>
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

function NutritionBadge({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#EBD2AD] p-4 text-center">
      <p className="text-2xl font-bold text-[#C58930]">
        {value}
        {unit}
      </p>
      <p className="text-xs text-[#6D5E6D] mt-1">{label}</p>
    </div>
  )
}
