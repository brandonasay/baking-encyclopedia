import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Baker Tools',
  description: 'Calculators, converters, and other tools for home bakers.',
}

const TOOLS = [
  {
    href: '/baker-tools/calculator',
    name: 'Home Bakery Calculator',
    description: 'Price what you bake from your real ingredient and packaging costs — suggested price, break-even, and what you actually earn per hour. Free, no account required.',
    badge: 'Free',
  },
]

export default function BakerToolsPage() {
  return (
    <div className="min-h-screen bg-[#FCFFEB]">
      <div className="bg-white border-b border-[#EBD2AD]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <p className="text-[#A64B2A] text-sm font-medium uppercase tracking-widest mb-3">
            Tools
          </p>
          <h1
            className="text-4xl md:text-5xl text-[#201D20] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Baker Tools
          </h1>
          <p className="text-[#6D5E6D] text-lg max-w-2xl leading-relaxed">
            Calculators, converters, and other handy tools for home bakers.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 gap-5">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group block bg-white rounded-2xl border border-[#EBD2AD] p-6 hover:border-[#C58930] hover:shadow-md hover:shadow-[#C58930]/10 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[#201D20] group-hover:text-[#C58930] transition-colors" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {tool.name}
                </h2>
                <span className="shrink-0 text-xs font-semibold text-[#41622D] bg-[#EEF3EA] px-2 py-0.5 rounded-full">{tool.badge}</span>
              </div>
              <p className="text-sm text-[#6D5E6D] leading-relaxed">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
