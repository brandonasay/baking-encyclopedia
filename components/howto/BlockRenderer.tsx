import Image from 'next/image'
import type { ContentBlock } from '@/lib/database.types'

export function parseBlocks(body: string | null): ContentBlock[] | null {
  if (!body) return null
  try {
    const parsed = JSON.parse(body)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.type) return parsed as ContentBlock[]
  } catch {}
  return null
}

export default function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        if (block.type === 'heading') {
          return (
            <h2
              key={block.id}
              className="text-2xl text-[#201D20] mt-10 mb-2 first:mt-0"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {block.content}
            </h2>
          )
        }

        if (block.type === 'text') {
          return (
            <p key={block.id} className="text-[#201D20] leading-relaxed text-base whitespace-pre-wrap">
              {block.content}
            </p>
          )
        }

        if (block.type === 'image') {
          return (
            <figure key={block.id} className="my-2">
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-[#EBD2AD]">
                <Image
                  src={block.url}
                  alt={block.alt || ''}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 720px"
                />
              </div>
              {block.alt && (
                <figcaption className="mt-2 text-xs text-center text-[#6D5E6D]">{block.alt}</figcaption>
              )}
            </figure>
          )
        }

        if (block.type === 'numbered_list') {
          return (
            <ol key={block.id} className="space-y-3">
              {block.items.filter(Boolean).map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F5EAC8] flex items-center justify-center text-sm font-semibold text-[#C58930]">
                    {i + 1}
                  </span>
                  <span className="text-[#201D20] leading-relaxed pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          )
        }

        if (block.type === 'bulleted_list') {
          return (
            <ul key={block.id} className="space-y-2">
              {block.items.filter(Boolean).map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-[#C58930]" />
                  <span className="text-[#201D20] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )
        }

        return null
      })}
    </div>
  )
}
