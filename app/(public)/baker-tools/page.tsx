import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Baker Tools',
  description: 'Calculators, converters, and other tools for home bakers — coming soon.',
}

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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-[#6D5E6D] text-lg">Coming soon.</p>
      </div>
    </div>
  )
}
