import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HowToCard from '@/components/howto/HowToCard'
import type { HowToArticle } from '@/lib/database.types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Microbakery Guides',
  description:
    'Practical guides for running your home microbakery — pricing, packaging, marketing, and more.',
}

type CardArticle = Pick<
  HowToArticle,
  'slug' | 'title' | 'headline' | 'section' | 'image_url' | 'read_time_minutes' | 'tags'
>

export default async function MicrobakerySection() {
  const supabase = await createClient()

  const { data: articles } = await supabase
    .from('howto_articles')
    .select('id, slug, title, headline, section, image_url, read_time_minutes, tags, featured')
    .eq('published', true)
    .eq('section', 'microbakery')
    .order('featured', { ascending: false })
    .order('title', { ascending: true })

  const allArticles = (articles ?? []) as (CardArticle & { id: string; featured: boolean })[]

  return (
    <div className="min-h-screen bg-[#FCFFEB]">
      {/* Hero */}
      <div className="bg-white border-b border-[#EBD2AD]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <nav className="text-sm text-[#6D5E6D] mb-4 flex items-center gap-2">
            <Link href="/how-to" className="hover:text-[#C58930] transition-colors">
              How-To
            </Link>
            <span>/</span>
            <span className="text-[#201D20]">Microbakery</span>
          </nav>
          <p className="text-[#C58930] text-sm font-medium uppercase tracking-widest mb-3">
            Microbakery
          </p>
          <h1
            className="text-4xl md:text-5xl text-[#201D20] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Microbakery Guides
          </h1>
          <p className="text-[#6D5E6D] text-lg max-w-2xl leading-relaxed">
            Everything you need to build and run a successful home microbakery business.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {allArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allArticles.map((article) => (
              <HowToCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#6D5E6D] text-lg">No guides published yet. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
