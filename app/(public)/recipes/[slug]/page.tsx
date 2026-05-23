import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, ChefHat, Users, Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Recipe, NutritionInfo } from '@/lib/database.types'
import RecipeVariantToggle from '@/components/recipes/RecipeVariantToggle'
import { IngredientsList } from '@/components/recipes/RecipeIngredientsList'
import { InstructionsSection } from '@/components/recipes/RecipeInstructionsSection'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: recipeData } = await supabase
    .from('recipes')
    .select('title, headline, seo_title, seo_description, image_url')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!recipeData) return { title: 'Recipe Not Found' }

  const recipe = recipeData as Pick<Recipe, 'title' | 'headline' | 'seo_title' | 'seo_description' | 'image_url'>

  return {
    title: recipe.seo_title ?? recipe.title,
    description: recipe.seo_description ?? recipe.headline ?? undefined,
    openGraph: {
      title: recipe.seo_title ?? recipe.title,
      description: recipe.seo_description ?? recipe.headline ?? undefined,
      images: recipe.image_url ? [{ url: recipe.image_url }] : [],
      type: 'article',
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: recipeData } = await supabase
    .from('recipes')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!recipeData) notFound()

  const recipe = recipeData as Recipe

  // Fetch related recipes by tag
  let relatedRecipes: {
    id: string
    slug: string
    title: string
    headline: string | null
    image_url: string | null
    total_time_minutes: number
  }[] = []

  if (recipe.tags?.length > 0) {
    const { data: related } = await supabase
      .from('recipes')
      .select('id, slug, title, headline, image_url, difficulty, total_time_minutes, tags, has_gluten_free, has_high_protein')
      .eq('published', true)
      .overlaps('tags', recipe.tags)
      .neq('id', recipe.id)
      .limit(4)

    relatedRecipes = related ?? []
  }

  const jsonLd = buildJsonLd(recipe)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#FAF8F4]">
        {/* Hero image */}
        <div className="relative w-full h-72 sm:h-96 lg:h-[480px] bg-[#E8D5C4] overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.image_alt ?? recipe.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5EDE4] to-[#E8D5C4]" />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-3 flex items-center gap-2 text-white/70 text-sm" aria-label="Breadcrumb">
              <Link href="/recipes" className="hover:text-white transition-colors">
                Recipes
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white/90 line-clamp-1">{recipe.title}</span>
            </nav>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {recipe.title}
            </h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="lg:grid lg:grid-cols-3 lg:gap-12">
            {/* ── Left column (main content) ──────────────────────────── */}
            <div className="lg:col-span-2 space-y-10">
              {/* Headline + meta */}
              <div className="space-y-4">
                {recipe.headline && (
                  <p className="text-xl text-[#7A6A5E] leading-relaxed">{recipe.headline}</p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <MetaBadge
                    icon={<ChefHat className="w-4 h-4" />}
                    label="Difficulty"
                    value={capitalize(recipe.difficulty)}
                    valueClass={difficultyColor(recipe.difficulty)}
                  />
                  <MetaBadge
                    icon={<Clock className="w-4 h-4" />}
                    label="Total time"
                    value={`${recipe.total_time_minutes} min`}
                  />
                  {recipe.prep_time_minutes && (
                    <MetaBadge label="Prep" value={`${recipe.prep_time_minutes} min`} />
                  )}
                  {recipe.cook_time_minutes && (
                    <MetaBadge label="Bake" value={`${recipe.cook_time_minutes} min`} />
                  )}
                  {recipe.base_yield && (
                    <MetaBadge label="Yield" value={recipe.base_yield} />
                  )}
                  {recipe.base_servings && (
                    <MetaBadge
                      icon={<Users className="w-4 h-4" />}
                      label="Servings"
                      value={String(recipe.base_servings)}
                    />
                  )}
                </div>

                {/* Diet variant toggles */}
                {(recipe.has_gluten_free || recipe.has_high_protein) && (
                  <RecipeVariantToggle
                    hasGlutenFree={recipe.has_gluten_free}
                    hasHighProtein={recipe.has_high_protein}
                    glutenFreeNotes={recipe.gluten_free_notes ?? undefined}
                    highProteinNotes={recipe.high_protein_notes ?? undefined}
                    baseIngredients={recipe.ingredients}
                    baseInstructions={recipe.instructions}
                    glutenFreeIngredients={recipe.gluten_free_ingredients ?? undefined}
                    glutenFreeInstructions={recipe.gluten_free_instructions ?? undefined}
                    highProteinIngredients={recipe.high_protein_ingredients ?? undefined}
                    highProteinInstructions={recipe.high_protein_instructions ?? undefined}
                  />
                )}
              </div>

              {/* Instructions (only shown when no variant toggle active on mobile) */}
              {!(recipe.has_gluten_free || recipe.has_high_protein) && (
                <>
                  <InstructionsSection instructions={recipe.instructions} />
                </>
              )}

              {/* Tips */}
              {recipe.tips?.length > 0 && (
                <section aria-labelledby="tips-heading">
                  <h2
                    id="tips-heading"
                    className="text-2xl font-bold text-[#1C1410] mb-5"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Baker&rsquo;s Tips
                  </h2>
                  <ul className="space-y-3">
                    {recipe.tips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-[#1C1410] leading-relaxed">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F5EDE4] text-[#C8652A] text-xs font-bold flex items-center justify-center mt-0.5"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Equipment */}
              {recipe.equipment?.length > 0 && (
                <section aria-labelledby="equipment-heading">
                  <h2
                    id="equipment-heading"
                    className="text-2xl font-bold text-[#1C1410] mb-5"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Equipment
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recipe.equipment.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-lg border border-[#E8E0D5] text-sm text-[#1C1410]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C8652A] flex-shrink-0" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Storage */}
              {recipe.storage_instructions && (
                <section
                  aria-labelledby="storage-heading"
                  className="p-6 bg-[#F5EDE4] rounded-2xl"
                >
                  <h2
                    id="storage-heading"
                    className="text-xl font-bold text-[#1C1410] mb-3"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Storage
                  </h2>
                  <p className="text-[#1C1410] leading-relaxed">{recipe.storage_instructions}</p>
                </section>
              )}

              {/* Nutrition */}
              {recipe.nutrition_per_serving && (
                <NutritionTable nutrition={recipe.nutrition_per_serving} />
              )}

              {/* Tags */}
              {recipe.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#E8E0D5]">
                  {recipe.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/recipes?tag=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full text-sm text-[#7A6A5E] bg-white border border-[#E8E0D5] hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right sidebar ───────────────────────────────────────── */}
            <aside className="mt-10 lg:mt-0 space-y-6">
              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-[#C8652A] text-white font-medium hover:bg-[#B55A24] transition-colors"
                  aria-label="Save this recipe"
                >
                  <Bookmark className="w-4 h-4" aria-hidden="true" />
                  Save Recipe
                </button>
                <button
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-white border border-[#E8E0D5] text-[#1C1410] font-medium hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
                  aria-label="Add ingredients to grocery list"
                >
                  Add to Grocery List
                </button>
              </div>

              {/* Ingredients card */}
              <div className="bg-white rounded-2xl border border-[#E8E0D5] overflow-hidden">
                <div className="px-6 py-4 bg-[#F5EDE4] border-b border-[#E8E0D5]">
                  <h2
                    className="text-lg font-bold text-[#1C1410]"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Ingredients
                  </h2>
                  {recipe.base_servings && (
                    <p className="text-sm text-[#7A6A5E] mt-0.5">
                      Makes {recipe.base_yield ?? `${recipe.base_servings} servings`}
                    </p>
                  )}
                </div>
                <div className="px-6 py-5">
                  <IngredientsList ingredients={recipe.ingredients} />
                </div>
              </div>
            </aside>
          </div>

          {/* Related recipes */}
          {relatedRecipes.length > 0 && (
            <section className="mt-16" aria-labelledby="related-heading">
              <h2
                id="related-heading"
                className="text-2xl font-bold text-[#1C1410] mb-6"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                You Might Also Like
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedRecipes.map((r) => (
                  <Link
                    key={r.id}
                    href={`/recipes/${r.slug}`}
                    className="group block bg-white rounded-xl border border-[#E8E0D5] overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[4/3] bg-[#F5EDE4]">
                      {r.image_url && (
                        <Image
                          src={r.image_url}
                          alt={r.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, 25vw"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-semibold text-[#1C1410] group-hover:text-[#C8652A] transition-colors line-clamp-2"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {r.title}
                      </h3>
                      <p className="text-xs text-[#7A6A5E] mt-1">{r.total_time_minutes} min</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetaBadge({
  icon,
  label,
  value,
  valueClass,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-[#E8E0D5]">
      {icon && <span className="text-[#7A6A5E]">{icon}</span>}
      <div>
        <p className="text-xs text-[#7A6A5E] leading-none mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-[#1C1410] ${valueClass ?? ''}`}>{value}</p>
      </div>
    </div>
  )
}

function NutritionTable({ nutrition }: { nutrition: NutritionInfo }) {
  const rows = [
    { label: 'Calories', value: nutrition.calories, unit: 'kcal' },
    { label: 'Protein', value: nutrition.protein_g, unit: 'g' },
    { label: 'Carbohydrates', value: nutrition.carbs_g, unit: 'g' },
    { label: 'Fat', value: nutrition.fat_g, unit: 'g' },
    { label: 'Fiber', value: nutrition.fiber_g, unit: 'g' },
  ].filter((r) => r.value != null)

  if (rows.length === 0) return null

  return (
    <section aria-labelledby="nutrition-heading">
      <h2
        id="nutrition-heading"
        className="text-2xl font-bold text-[#1C1410] mb-5"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        Nutrition per serving
      </h2>
      <div className="bg-white rounded-2xl border border-[#E8E0D5] overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">Nutritional information per serving</caption>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F4]'}
              >
                <td className="px-5 py-3 text-[#7A6A5E]">{row.label}</td>
                <td className="px-5 py-3 text-right font-semibold text-[#1C1410]">
                  {row.value}
                  <span className="font-normal text-[#7A6A5E] ml-0.5">{row.unit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function difficultyColor(difficulty: string) {
  return difficulty === 'beginner'
    ? 'text-green-700'
    : difficulty === 'advanced'
    ? 'text-red-700'
    : 'text-amber-700'
}

function buildJsonLd(recipe: Recipe) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.headline ?? undefined,
    image: recipe.image_url ?? undefined,
    recipeYield: recipe.base_yield ?? recipe.base_servings?.toString() ?? undefined,
    prepTime: recipe.prep_time_minutes ? `PT${recipe.prep_time_minutes}M` : undefined,
    cookTime: recipe.cook_time_minutes ? `PT${recipe.cook_time_minutes}M` : undefined,
    totalTime: `PT${recipe.total_time_minutes}M`,
    difficulty: capitalize(recipe.difficulty),
    recipeIngredient: recipe.ingredients.map(
      (ing) => `${ing.quantity} ${ing.unit} ${ing.ingredient_name}${ing.notes ? ` (${ing.notes})` : ''}`
    ),
    recipeInstructions: recipe.instructions.map((step) => ({
      '@type': 'HowToStep',
      name: step.title ?? `Step ${step.step_number}`,
      text: step.body,
    })),
    keywords: recipe.tags?.join(', ') ?? undefined,
  }

  if (recipe.nutrition_per_serving) {
    const n = recipe.nutrition_per_serving
    ld.nutrition = {
      '@type': 'NutritionInformation',
      ...(n.calories != null && { calories: `${n.calories} calories` }),
      ...(n.protein_g != null && { proteinContent: `${n.protein_g} g` }),
      ...(n.carbs_g != null && { carbohydrateContent: `${n.carbs_g} g` }),
      ...(n.fat_g != null && { fatContent: `${n.fat_g} g` }),
      ...(n.fiber_g != null && { fiberContent: `${n.fiber_g} g` }),
    }
  }

  return ld
}
