import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600
import type { Ingredient } from '@/lib/database.types'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingredients')
    .select('name, headline, seo_title, seo_description, image_url')
    .eq('slug', slug)
    .eq('published', true)
    .single() as { data: Pick<Ingredient, 'name' | 'headline' | 'seo_title' | 'seo_description' | 'image_url'> | null; error: unknown }

  if (!data) return {}

  return {
    title: data.seo_title ?? data.name,
    description: data.seo_description ?? data.headline ?? undefined,
    openGraph: {
      title: data.seo_title ?? data.name,
      description: data.seo_description ?? data.headline ?? undefined,
      images: data.image_url ? [data.image_url] : [],
    },
  }
}

export default async function IngredientDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single() as { data: Ingredient | null; error: unknown }

  if (!ingredient) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    name: ingredient.name,
    description: ingredient.headline ?? ingredient.seo_description ?? undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bakingencyclopedia.com'}/ingredients/${ingredient.slug}`,
    image: ingredient.image_url ?? undefined,
    mainEntity: {
      '@type': 'Thing',
      name: ingredient.name,
      description: ingredient.origins ?? undefined,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#FAF8F4]">
        {/* Hero */}
        <div className="relative bg-[#1C1410] text-white overflow-hidden">
          <div className="absolute inset-0">
            {ingredient.image_url ? (
              <Image
                src={ingredient.image_url}
                alt={ingredient.image_alt ?? ingredient.name}
                fill
                className="object-cover opacity-30"
                priority
                sizes="100vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#C8652A]/60 to-[#1C1410]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] via-[#1C1410]/60 to-transparent" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
              <Link href="/ingredients" className="hover:text-white transition-colors">
                Ingredients
              </Link>
              <span>/</span>
              <span className="text-white/80">{ingredient.category}</span>
            </nav>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#C8652A]/80 text-white mb-4">
              {ingredient.category}
            </span>

            <h1
              className="text-4xl md:text-6xl text-white leading-tight mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {ingredient.name}
            </h1>

            {ingredient.headline && (
              <p className="text-xl text-white/80 max-w-2xl leading-relaxed">
                {ingredient.headline}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Origins */}
              {ingredient.origins && (
                <section>
                  <h2
                    className="text-2xl text-[#1C1410] mb-4"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Origins
                  </h2>
                  <div className="prose">
                    {ingredient.origins.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* How used in baking */}
              {ingredient.how_used_in_baking && (
                <section>
                  <h2
                    className="text-2xl text-[#1C1410] mb-4"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    How It&apos;s Used in Baking
                  </h2>
                  <div className="prose">
                    {ingredient.how_used_in_baking.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* Flavor notes */}
              {ingredient.flavor_notes && (
                <section>
                  <h2
                    className="text-2xl text-[#1C1410] mb-4"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Flavor Profile
                  </h2>
                  <div className="prose">
                    {ingredient.flavor_notes.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* Baker's percentage */}
              {ingredient.baker_percentage && (
                <section>
                  <div className="rounded-xl bg-[#F5EDE4] border border-[#C8652A]/20 p-6">
                    <h2
                      className="text-xl text-[#C8652A] mb-3"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Baker&apos;s Percentage
                    </h2>
                    <div className="prose">
                      {ingredient.baker_percentage.split('\n\n').map((para, i) => (
                        <p key={i} className="text-[#1C1410]">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Tags */}
              {ingredient.tags && ingredient.tags.length > 0 && (
                <section>
                  <h2
                    className="text-lg text-[#7A6A5E] mb-3"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {ingredient.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-sm text-[#7A6A5E] bg-white border border-[#E8E0D5]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Storage tips */}
              {ingredient.storage_tips && (
                <div className="bg-white rounded-xl border border-[#E8E0D5] p-6">
                  <h3
                    className="text-lg text-[#1C1410] mb-3"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Storage Tips
                  </h3>
                  <p className="text-sm text-[#7A6A5E] leading-relaxed">
                    {ingredient.storage_tips}
                  </p>
                </div>
              )}

              {/* Buying tips */}
              {ingredient.buying_tips && (
                <div className="bg-white rounded-xl border border-[#E8E0D5] p-6">
                  <h3
                    className="text-lg text-[#1C1410] mb-3"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Buying Tips
                  </h3>
                  <p className="text-sm text-[#7A6A5E] leading-relaxed">
                    {ingredient.buying_tips}
                  </p>
                </div>
              )}

              {/* Sourcing notes */}
              {ingredient.sourcing_notes && (
                <div className="bg-white rounded-xl border border-[#E8E0D5] p-6">
                  <h3
                    className="text-lg text-[#1C1410] mb-3"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Sourcing Notes
                  </h3>
                  <p className="text-sm text-[#7A6A5E] leading-relaxed">
                    {ingredient.sourcing_notes}
                  </p>
                </div>
              )}

              {/* Common substitutes */}
              {ingredient.common_substitutes && ingredient.common_substitutes.length > 0 && (
                <div className="bg-white rounded-xl border border-[#E8E0D5] p-6">
                  <h3
                    className="text-lg text-[#1C1410] mb-4"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Common Substitutes
                  </h3>
                  <ul className="space-y-4">
                    {ingredient.common_substitutes.map((sub, i) => (
                      <li key={i} className="border-b border-[#E8E0D5] last:border-0 pb-4 last:pb-0">
                        {sub.ingredient_id ? (
                          <Link
                            href={`/ingredients/${sub.ingredient_id}`}
                            className="font-medium text-sm text-[#C8652A] hover:underline"
                          >
                            {sub.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-sm text-[#1C1410]">{sub.name}</span>
                        )}
                        {sub.notes && (
                          <p className="text-xs text-[#7A6A5E] mt-1 leading-relaxed">{sub.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
