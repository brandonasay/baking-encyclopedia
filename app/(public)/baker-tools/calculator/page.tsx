import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Home Bakery Calculator — Free Pricing & Profit Tool for Home Bakers',
  description:
    'Free pricing calculator for home and cottage-food bakers. Enter your real ingredient and packaging costs, get a suggested price, your break-even point, and what you actually earn per hour — no account required.',
  robots: { index: true, follow: true },
}

const FAQS = [
  {
    q: 'How much should I charge for cookies?',
    a: 'It depends on your real costs — ingredients, packaging, your time, and a share of overhead like your mixer or oven. The calculator adds those up from what you actually paid, then applies a target profit margin and your payment processor\'s fees to suggest a price. Two bakers making the same cookie can have very different costs depending on where they shop and how they package, so there\'s no single right number — just the one that\'s right for your kitchen.',
  },
  {
    q: 'Should I pay myself an hourly wage?',
    a: 'Most bakers selling regularly should — otherwise "profit" quietly includes hours of unpaid labor. Set an hourly wage in Settings and it\'s built into your suggested price. If you\'re baking as a hobby and just want to cover ingredients, there\'s a "don\'t count my time" option that drops wage out of the cost entirely.',
  },
  {
    q: 'How do payment fees change my price?',
    a: 'Venmo, Square, Stripe, and similar processors each take a percentage plus a small fixed fee out of every sale. If you don\'t account for that, your actual take-home is lower than your sticker price. The calculator backs the fee out of your target price so what\'s left still covers your costs and margin after the processor takes its cut.',
  },
]

export default function CalculatorLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Home Bakery Calculator',
        url: 'https://bakingencyclopedia.com/baker-tools/calculator',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: metadata.description,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Baker Tools', item: 'https://bakingencyclopedia.com/baker-tools' },
          { '@type': 'ListItem', position: 2, name: 'Home Bakery Calculator', item: 'https://bakingencyclopedia.com/baker-tools/calculator' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[#FCFFEB]">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-white border-b border-[#EBD2AD]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <nav className="text-sm text-[#6D5E6D] mb-4">
            <Link href="/baker-tools" className="hover:text-[#201D20]">Baker Tools</Link>
            <span className="mx-2">/</span>
            <span className="text-[#201D20]">Calculator</span>
          </nav>
          <p className="text-[#A64B2A] text-sm font-medium uppercase tracking-widest mb-3">Free · No account required</p>
          <h1 className="text-4xl md:text-5xl text-[#201D20] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Home Bakery Calculator
          </h1>
          <p className="text-[#6D5E6D] text-lg max-w-2xl leading-relaxed mb-8">
            Find out what to charge, what you actually earn per hour, and what to bake and buy for a weekend of orders —
            built from your real ingredient and packaging costs, not a guess.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/baker-tools/calculator/products" className="px-5 py-3 rounded-xl bg-[#C58930] text-white font-semibold hover:bg-[#A87225] transition-colors">
              Price something I bake
            </Link>
            <Link href="/baker-tools/calculator/plans" className="px-5 py-3 rounded-xl border border-[#EBD2AD] bg-white text-[#201D20] font-semibold hover:border-[#C58930] transition-colors">
              Plan a sale
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        {/* Worked example */}
        <section>
          <h2 className="text-2xl font-bold text-[#201D20] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>A worked example</h2>
          <p className="text-[#6D5E6D] mb-6 leading-relaxed">
            Here&apos;s a real box of 6 chocolate chip cookies, priced with $20/hour labor, 30% target margin, and Venmo&apos;s fees (1.9% + $0.10).
          </p>
          <div className="bg-white rounded-xl border border-[#EBD2AD] p-6 grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6D5E6D] mb-2">Cost breakdown</p>
              <dl className="space-y-1.5 text-sm">
                {[['Ingredients', '$2.59'], ['Packaging', '$0.91'], ['Labor (14.25 min)', '$4.75'], ['Overhead', '$0.50'], ['Total cost', '$8.75']].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-[#6D5E6D]">{k}</dt><dd className="font-medium text-[#201D20]">{v}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6D5E6D] mb-2">Result</p>
              <dl className="space-y-1.5 text-sm">
                {[['Suggested price', '$13.00'], ['Break-even', '$9.02'], ['Profit', '$3.90'], ['Margin', '30.0%'], ['Effective hourly wage', '$36.43/hr']].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-[#6D5E6D]">{k}</dt><dd className="font-medium text-[#201D20]">{v}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* How it's calculated */}
        <section>
          <h2 className="text-2xl font-bold text-[#201D20] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>How the price is calculated</h2>
          <div className="prose max-w-none text-[#6D5E6D] space-y-3 leading-relaxed">
            <p>
              Every pantry item&apos;s cost per gram, milliliter, or unit comes from the package size and price you actually paid.
              A recipe&apos;s batch cost is the sum of its ingredient lines at those real costs, divided by its yield.
            </p>
            <p>
              A product&apos;s total cost adds packaging, a share of your hourly wage for the active minutes it takes, and a
              slice of your monthly overhead (spread across how many products you expect to sell that month).
            </p>
            <p>
              The suggested price covers that cost plus your payment processor&apos;s fee plus your target profit margin — then
              rounds up to your price step, so the margin is never shorted by rounding down.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-[#201D20] mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Frequently asked questions</h2>
          <div className="space-y-5">
            {FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold text-[#201D20] mb-1.5">{f.q}</h3>
                <p className="text-[#6D5E6D] leading-relaxed text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center pt-4">
          <Link href="/baker-tools/calculator/products" className="inline-block px-6 py-3 rounded-xl bg-[#C58930] text-white font-semibold hover:bg-[#A87225] transition-colors">
            Try it with the example above →
          </Link>
        </div>

        <section className="border-t border-[#EBD2AD] pt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6D5E6D] mb-3">Related reading</h2>
          <Link href="/how-to/microbakery" className="text-[#C58930] font-medium hover:underline">
            How-to guides for starting a microbakery →
          </Link>
        </section>
      </div>
    </div>
  )
}
