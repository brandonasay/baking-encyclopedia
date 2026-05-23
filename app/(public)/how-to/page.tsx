import type { Metadata } from 'next'
import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import HowToCard from '@/components/howto/HowToCard'
import type { HowToArticle } from '@/lib/database.types'

export const metadata: Metadata = {
  title: 'How-To Guides',
  description:
    'Step-by-step baking techniques and microbakery guides — everything from laminating dough to running your home bakery.',
}

type CardArticle = Pick<
  HowToArticle,
  'slug' | 'title' | 'headline' | 'section' | 'image_url' | 'read_time_minutes' | 'tags'
>

export default async function HowToPage() {
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('howto_articles')
    .select('id, slug, title, headline, section, image_url, read_time_minutes, tags, featured')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('title', { ascending: true })

  const allArticles = (articles ?? []) as (CardArticle & { id: string; featured: boolean })[]

  const featured = allArticles.filter((a) => a.featured)
  const baking = allArticles.filter((a) => a.section === 'baking')
  const microbakery = allArticles.filter((a) => a.section === 'microbakery')

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* Hero */}
      <div className="bg-white border-b border-[#E8E0D5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-[#C8652A] text-sm font-medium uppercase tracking-widest mb-3">
            Guides
          </p>
          <h1
            className="text-4xl md:text-5xl text-[#1C1410] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            How-To Guides
          </h1>
          <p className="text-[#7A6A5E] text-lg max-w-2xl leading-relaxed">
            Master baking techniques and build your microbakery with step-by-step guides written for
            serious home bakers.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Featured */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-7">
              <BookOpen className="w-5 h-5 text-[#C8652A]" aria-hidden="true" />
              <h2
                className="text-2xl text-[#1C1410]"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Featured Guides
              </h2>
              <div className="flex-1 h-px bg-[#E8E0D5]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((article) => (
                <HowToCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Baking Techniques */}
        {baking.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-7">
              <h2
                className="text-2xl text-[#1C1410]"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Baking Techniques
              </h2>
              <div className="flex-1 h-px bg-[#E8E0D5]" />
              <span className="text-sm text-[#7A6A5E]">
                {baking.length} guide{baking.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {baking.map((article) => (
                <HowToCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Microbakery */}
        {microbakery.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-7">
              <h2
                className="text-2xl text-[#1C1410]"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Microbakery
              </h2>
              <div className="flex-1 h-px bg-[#E8E0D5]" />
              <span className="text-sm text-[#7A6A5E]">
                {microbakery.length} guide{microbakery.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {microbakery.map((article) => (
                <HowToCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {allArticles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#7A6A5E] text-lg">No guides published yet. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
