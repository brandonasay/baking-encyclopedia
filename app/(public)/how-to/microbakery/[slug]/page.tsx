import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import RecipeCard from '@/components/recipes/RecipeCard'
import HowToCard from '@/components/howto/HowToCard'
import type { HowToArticle, Recipe } from '@/lib/database.types'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('howto_articles')
    .select('title, headline, seo_title, seo_description, image_url')
    .eq('slug', slug)
    .eq('section', 'microbakery')
    .eq('published', true)
    .single() as { data: Pick<HowToArticle, 'title' | 'headline' | 'seo_title' | 'seo_description' | 'image_url'> | null; error: unknown }

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

export default async function MicrobakeryArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('howto_articles')
    .select('*')
    .eq('slug', slug)
    .eq('section', 'microbakery')
    .eq('published', true)
    .single() as { data: HowToArticle | null; error: unknown }

  if (!article) notFound()

  type RelatedRecipe = Pick<
    Recipe,
    'id' | 'slug' | 'title' | 'headline' | 'image_url' | 'difficulty' | 'total_time_minutes' | 'tags' | 'has_gluten_free' | 'has_high_protein'
  >
  type RelatedArticle = Pick<
    HowToArticle,
    'id' | 'slug' | 'title' | 'headline' | 'section' | 'image_url' | 'read_time_minutes' | 'tags'
  >

  const emptyRecipes: { data: RelatedRecipe[] | null } = { data: [] }
  const emptyArticles: { data: RelatedArticle[] | null } = { data: [] }

  const [relatedRecipesRes, relatedArticlesRes] = await Promise.all([
    article.related_recipe_ids.length > 0
      ? (supabase
          .from('recipes')
          .select(
            'id, slug, title, headline, image_url, difficulty, total_time_minutes, tags, has_gluten_free, has_high_protein'
          )
          .in('id', article.related_recipe_ids)
          .eq('published', true) as unknown as Promise<{ data: RelatedRecipe[] | null }>)
      : Promise.resolve(emptyRecipes),

    article.related_article_ids.length > 0
      ? (supabase
          .from('howto_articles')
          .select('id, slug, title, headline, section, image_url, read_time_minutes, tags')
          .in('id', article.related_article_ids)
          .eq('published', true) as unknown as Promise<{ data: RelatedArticle[] | null }>)
      : Promise.resolve(emptyArticles),
  ])

  const relatedRecipes = relatedRecipesRes.data ?? []
  const relatedArticles = relatedArticlesRes.data ?? []

  const hasSteps = article.steps && article.steps.length > 0

  const jsonLd = hasSteps
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: article.title,
        description: article.headline ?? article.seo_description ?? undefined,
        image: article.image_url ?? undefined,
        totalTime: article.read_time_minutes ? `PT${article.read_time_minutes}M` : undefined,
        step: article.steps.map((step) => ({
          '@type': 'HowToStep',
          position: step.step_number,
          name: step.title,
          text: step.description,
        })),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.headline ?? undefined,
        image: article.image_url ?? undefined,
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
            {article.image_url ? (
              <Image
                src={article.image_url}
                alt={article.image_alt ?? article.title}
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

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
              <Link href="/how-to" className="hover:text-white transition-colors">
                How-To
              </Link>
              <span>/</span>
              <Link href="/how-to/microbakery" className="hover:text-white transition-colors">
                Microbakery
              </Link>
            </nav>

            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-stone-100/20 text-stone-100">
                Microbakery
              </span>

              {article.read_time_minutes != null && (
                <span className="flex items-center gap-1.5 text-sm text-white/70">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {article.read_time_minutes} min read
                </span>
              )}
            </div>

            <h1
              className="text-4xl md:text-5xl text-white leading-tight mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {article.title}
            </h1>

            {article.headline && (
              <p className="text-xl text-white/80 leading-relaxed">{article.headline}</p>
            )}
          </div>
        </div>

        {/* Article body */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Steps */}
          {hasSteps && (
            <section className="mb-12">
              <h2
                className="text-2xl text-[#201D20] mb-6"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Steps
              </h2>
              <ol className="space-y-5">
                {article.steps.map((step) => (
                  <li
                    key={step.step_number}
                    className="flex gap-5 bg-white rounded-xl border border-[#EBD2AD] p-5"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5EAC8] flex items-center justify-center">
                      <span
                        className="text-[#C58930] font-semibold text-sm"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {step.step_number}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base font-semibold text-[#201D20] mb-1.5"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-[#6D5E6D] leading-relaxed">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Body text */}
          {article.body && (
            <section className="mb-12">
              <div className="prose">
                {article.body.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-16 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-sm text-[#6D5E6D] bg-white border border-[#EBD2AD]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Related recipes */}
          {relatedRecipes.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <h2
                  className="text-2xl text-[#201D20]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Related Recipes
                </h2>
                <div className="flex-1 h-px bg-[#EBD2AD]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {relatedRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          )}

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <h2
                  className="text-2xl text-[#201D20]"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Related Guides
                </h2>
                <div className="flex-1 h-px bg-[#EBD2AD]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {relatedArticles.map((rel) => (
                  <HowToCard key={rel.id} article={rel} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
