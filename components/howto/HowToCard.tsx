import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import type { HowToArticle } from '@/lib/database.types'

type HowToCardProps = {
  article: Pick<
    HowToArticle,
    'slug' | 'title' | 'headline' | 'section' | 'image_url' | 'read_time_minutes' | 'tags'
  >
}

const sectionConfig = {
  baking: {
    label: 'Baking',
    className: 'bg-[#F5EAC8] text-[#C58930]',
  },
  microbakery: {
    label: 'Microbakery',
    className: 'bg-[#EEF3EA] text-[#41622D]',
  },
}

export default function HowToCard({ article }: HowToCardProps) {
  const section = sectionConfig[article.section] ?? sectionConfig.baking

  return (
    <Link
      href={`/how-to/${article.section}/${article.slug}`}
      className="group block h-full"
      aria-label={article.title}
    >
      <article className="bg-white rounded-xl overflow-hidden border border-[#EBD2AD] h-full flex flex-col transition-shadow duration-200 hover:shadow-lg hover:shadow-[#41622D]/10">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          {article.image_url ? (
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5EAC8] to-[#D6BE97] flex items-end p-4">
              <span
                className="text-[#6D5E6D] text-sm leading-snug line-clamp-3"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {article.title}
              </span>
            </div>
          )}

          {/* Section badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${section.className}`}>
              {section.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          <h3
            className="text-lg leading-snug text-[#201D20] line-clamp-2 group-hover:text-[#41622D] transition-colors duration-150"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {article.title}
          </h3>

          {article.headline && (
            <p className="text-sm text-[#6D5E6D] line-clamp-2 leading-relaxed flex-1">
              {article.headline}
            </p>
          )}

          {/* Footer row */}
          <div className="mt-auto pt-3 border-t border-[#EBD2AD] flex items-center justify-between">
            {article.read_time_minutes != null && (
              <span className="flex items-center gap-1.5 text-xs text-[#6D5E6D]">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {article.read_time_minutes} min read
              </span>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end">
                {article.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] text-[#6D5E6D] bg-[#FCFFEB] border border-[#EBD2AD]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
