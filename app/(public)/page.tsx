import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, ChevronRight, Mail } from 'lucide-react'
import RecipeCard from '@/components/recipes/RecipeCard'
import HowToCard from '@/components/howto/HowToCard'
import NewsletterForm from './NewsletterForm'
import type { Recipe, HowToArticle, RecipeCategory } from '@/lib/database.types'

export const revalidate = 3600

// ---------------------------------------------------------------------------
// Category emoji map
// ---------------------------------------------------------------------------
const categoryEmoji: Record<string, string> = {
  bread: '🍞',
  cake: '🎂',
  cookies: '🍪',
  pastry: '🥐',
  muffins: '🧁',
  pies: '🥧',
  sourdough: '🫓',
  rolls: '🥖',
  brownies: '🍫',
  scones: '🫐',
}

function getCategoryEmoji(slug: string): string {
  return categoryEmoji[slug.toLowerCase()] ?? '🧁'
}

// ---------------------------------------------------------------------------
// Quick ingredient category links
// ---------------------------------------------------------------------------
const INGREDIENT_CATEGORIES = ['Flours', 'Leaveners', 'Fats & Oils', 'Sweeteners']

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function HomePage() {
  const supabase = await createClient()

  const [recipesResult, articlesResult, categoriesResult] = await Promise.all([
    supabase
      .from('recipes')
      .select('id,slug,title,headline,image_url,difficulty,total_time_minutes,tags,has_gluten_free,has_high_protein,recipe_categories(slug)')
      .eq('published', true)
      .eq('featured', true)
      .limit(6),
    supabase
      .from('howto_articles')
      .select('id,slug,title,headline,section,image_url,read_time_minutes,tags')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('recipe_categories')
      .select('*')
      .order('sort_order'),
  ])

  const featuredRecipes = (recipesResult.data ?? []) as unknown as Array<Pick<
    Recipe,
    'id' | 'slug' | 'title' | 'headline' | 'image_url' | 'difficulty' | 'total_time_minutes' | 'tags' | 'has_gluten_free' | 'has_high_protein'
  > & { recipe_categories: { slug: string } | null }>
  const latestArticles = (articlesResult.data ?? []) as Array<Pick<
    HowToArticle,
    'id' | 'slug' | 'title' | 'headline' | 'section' | 'image_url' | 'read_time_minutes' | 'tags'
  >>
  const categories = (categoriesResult.data ?? []) as RecipeCategory[]

  return (
    <div className="bg-[#FAF8F4]">

      {/* ------------------------------------------------------------------ */}
      {/* Hero */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5EDE4] to-white">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#C8652A]/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-[#C8652A]/5" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-[#C8652A]/10 text-[#C8652A] text-xs font-semibold uppercase tracking-widest">
            Your Complete Baking Reference
          </span>
          <h1
            className="text-5xl md:text-7xl font-bold text-[#1C1410] leading-tight mb-6"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            The Baking<br className="hidden sm:block" /> Encyclopedia
          </h1>
          <p className="text-lg md:text-xl text-[#7A6A5E] max-w-2xl mx-auto mb-10 leading-relaxed">
            Your complete reference for recipes, ingredients, and techniques — built for bakers
            who want to understand the why behind every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/recipes"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#C8652A] hover:bg-[#b55a25] text-white font-semibold text-base transition-colors duration-150 shadow-sm shadow-[#C8652A]/30"
            >
              Browse Recipes
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/ingredients"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-white border border-[#E8E0D5] hover:border-[#C8652A] hover:text-[#C8652A] text-[#1C1410] font-semibold text-base transition-colors duration-150"
            >
              Explore Ingredients
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Featured Recipes */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1C1410] mb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Featured Recipes
            </h2>
            <p className="text-[#7A6A5E]">Hand-picked favorites from our collection</p>
          </div>
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1.5 text-[#C8652A] hover:text-[#b55a25] font-medium text-sm transition-colors duration-150 shrink-0"
          >
            View all recipes
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} categorySlug={(recipe as any).recipe_categories?.slug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#7A6A5E]">
            No featured recipes yet — check back soon!
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Browse by Category */}
      {/* ------------------------------------------------------------------ */}
      {categories.length > 0 && (
        <section className="border-y border-[#E8E0D5] bg-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className="text-2xl font-bold text-[#1C1410] mb-6 text-center"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Browse by Category
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/recipes/${cat.slug}`}
                  className="snap-start shrink-0 flex flex-col items-center gap-2 px-5 py-4 rounded-xl border border-[#E8E0D5] bg-[#FAF8F4] hover:border-[#C8652A] hover:bg-[#F5EDE4] transition-colors duration-150 min-w-[100px]"
                >
                  <span className="text-2xl" aria-hidden="true">{getCategoryEmoji(cat.slug)}</span>
                  <span className="text-xs font-medium text-[#1C1410] text-center leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* How-To Guides */}
      {/* ------------------------------------------------------------------ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1C1410] mb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Learn to Bake
            </h2>
            <p className="text-[#7A6A5E]">Guides and techniques for every skill level</p>
          </div>
          <Link
            href="/how-to"
            className="inline-flex items-center gap-1.5 text-[#C8652A] hover:text-[#b55a25] font-medium text-sm transition-colors duration-150 shrink-0"
          >
            All guides
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {latestArticles.map((article) => (
              <HowToCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-[#7A6A5E]">
            No guides published yet.
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Ingredients Encyclopedia CTA */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gradient-to-br from-[#1C1410] to-[#3a2a1e] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center gap-12">
          <div className="flex-1">
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Know Your Ingredients
            </h2>
            <p className="text-[#c9b8a8] text-lg mb-8 leading-relaxed max-w-lg">
              Understand what every ingredient does — from why bread flour gives you chewier loaves
              to how baking soda and powder differ. Our ingredient encyclopedia is your
              baker&apos;s reference guide.
            </p>
            <Link
              href="/ingredients"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-[#C8652A] hover:bg-[#b55a25] text-white font-semibold text-base transition-colors duration-150"
            >
              Explore Ingredients
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-64 shrink-0">
            {INGREDIENT_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/ingredients?category=${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="flex items-center justify-center px-4 py-5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium text-center leading-tight transition-colors duration-150"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Newsletter */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-[#F5EDE4] py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#C8652A]/15 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-[#C8652A]" />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1C1410] mb-3"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Join Our Baker Community
          </h2>
          <p className="text-[#7A6A5E] mb-8 leading-relaxed">
            New recipes, techniques, and baking science — delivered to your inbox. No spam,
            unsubscribe any time.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}
