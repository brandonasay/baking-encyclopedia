import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How-To Guides',
  description:
    'Step-by-step baking techniques and microbakery business guides — choose your path.',
}

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-[#FCFFEB]">
      {/* Hero */}
      <div className="bg-white border-b border-[#EBD2AD]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-[#C58930] text-sm font-medium uppercase tracking-widest mb-3">
            Guides
          </p>
          <h1
            className="text-4xl md:text-5xl text-[#201D20] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            How-To Guides
          </h1>
          <p className="text-[#6D5E6D] text-lg max-w-2xl leading-relaxed">
            Whether you're perfecting your sourdough or building a business around your baking,
            we've got guides for both sides.
          </p>
        </div>
      </div>

      {/* Two-path cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* The Baking Side */}
          <Link
            href="/how-to/baking"
            className="group block"
            aria-label="The Baking Side — baking technique guides"
          >
            <div className="bg-white rounded-2xl border border-[#EBD2AD] overflow-hidden h-full flex flex-col transition-shadow duration-200 hover:shadow-xl hover:shadow-[#C58930]/10">
              <div className="h-3 bg-[#C58930]" />
              <div className="flex flex-col flex-1 p-8 gap-5">
                <div className="w-12 h-12 rounded-full bg-[#F5EAC8] flex items-center justify-center text-2xl">
                  🍞
                </div>
                <div>
                  <h2
                    className="text-3xl text-[#201D20] mb-3 group-hover:text-[#C58930] transition-colors duration-150"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    The Baking Side
                  </h2>
                  <p className="text-[#6D5E6D] leading-relaxed">
                    Master techniques — laminating dough, shaping sourdough, building flavor —
                    all the craft that makes your baking exceptional.
                  </p>
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2 text-[#C58930] font-medium">
                  <span>Explore guides</span>
                  <span className="transition-transform duration-150 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* The Business Side */}
          <Link
            href="/how-to/microbakery"
            className="group block"
            aria-label="The Business Side — microbakery guides"
          >
            <div className="bg-white rounded-2xl border border-[#EBD2AD] overflow-hidden h-full flex flex-col transition-shadow duration-200 hover:shadow-xl hover:shadow-[#41622D]/10">
              <div className="h-3 bg-[#41622D]" />
              <div className="flex flex-col flex-1 p-8 gap-5">
                <div className="w-12 h-12 rounded-full bg-[#EEF3EA] flex items-center justify-center text-2xl">
                  🏪
                </div>
                <div>
                  <h2
                    className="text-3xl text-[#201D20] mb-3 group-hover:text-[#41622D] transition-colors duration-150"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    The Business Side
                  </h2>
                  <p className="text-[#6D5E6D] leading-relaxed">
                    Build your microbakery — pricing, licensing, marketing, and everything
                    else that turns a passion for baking into a real business.
                  </p>
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2 text-[#41622D] font-medium">
                  <span>Explore guides</span>
                  <span className="transition-transform duration-150 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
