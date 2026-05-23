import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'

export const revalidate = 3600

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bakingencyclopedia.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch all published recipes with category slug
  const { data: recipes } = await supabase
    .from('recipes')
    .select('slug, updated_at, category_id, recipe_categories(slug)')
    .eq('published', true)

  // Fetch all published ingredients
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('slug, updated_at')
    .eq('published', true)

  // Fetch all published how-to articles
  const { data: howtos } = await supabase
    .from('howto_articles')
    .select('slug, updated_at')
    .eq('published', true)

  // Fetch all recipe categories
  const { data: categories } = await supabase
    .from('recipe_categories')
    .select('slug, created_at')

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/recipes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/ingredients`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/how-to`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const recipePages: MetadataRoute.Sitemap = (recipes ?? []).map((recipe) => {
    const rc = recipe.recipe_categories
    const categorySlug = (Array.isArray(rc) ? null : (rc as { slug: string } | null))?.slug ?? 'uncategorized'
    return {
      url: `${BASE_URL}/recipes/${categorySlug}/${recipe.slug}`,
      lastModified: recipe.updated_at ? new Date(recipe.updated_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  const ingredientPages: MetadataRoute.Sitemap = (ingredients ?? []).map((ingredient) => ({
    url: `${BASE_URL}/ingredients/${ingredient.slug}`,
    lastModified: ingredient.updated_at ? new Date(ingredient.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const howtoPages: MetadataRoute.Sitemap = (howtos ?? []).map((article) => ({
    url: `${BASE_URL}/how-to/${article.slug}`,
    lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((category) => ({
    url: `${BASE_URL}/recipes/${category.slug}`,
    lastModified: category.created_at ? new Date(category.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...recipePages,
    ...ingredientPages,
    ...howtoPages,
  ]
}
