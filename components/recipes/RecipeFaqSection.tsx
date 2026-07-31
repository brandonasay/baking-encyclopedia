'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { RecipeFaq } from '@/lib/database.types'

export function RecipeFaqSection({ faqs }: { faqs: RecipeFaq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!faqs || faqs.length === 0) return null

  return (
    <section aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="text-2xl font-bold text-[#201D20] mb-5"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-[#EBD2AD] rounded-xl border border-[#EBD2AD] bg-white overflow-hidden">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#FCFFEB] transition-colors"
              >
                <span className="font-medium text-[#201D20]">{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-[#6D5E6D] transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div id={`faq-answer-${i}`} className="px-5 pb-4">
                  <p className="text-sm text-[#6D5E6D] leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
