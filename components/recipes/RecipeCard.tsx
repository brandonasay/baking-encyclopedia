import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import type { Recipe } from '@/lib/database.types'

type RecipeCardProps = {
  recipe: Pick<
    Recipe,
    | 'id'
    | 'slug'
    | 'title'
    | 'headline'
    | 'image_url'
    | 'total_time_minutes'
    | 'has_gluten_free'
    | 'has_high_protein'
  >
  categorySlug?: string
}

export default function RecipeCard({ recipe, categorySlug }: RecipeCardProps) {
  return (
    <Link
      href={categorySlug ? `/recipes/${categorySlug}/${recipe.slug}` : `/recipes/${recipe.slug}`}
      className="group block h-full"
      aria-label={recipe.title}
    >
      <article className="bg-white rounded-xl overflow-hidden border border-[#EBD2AD] h-full flex flex-col transition-shadow duration-200 hover:shadow-lg hover:shadow-[#C58930]/10">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5EAC8] to-[#D6BE97] flex items-end p-4">
              <span className="font-playfair text-[#6D5E6D] text-sm leading-snug line-clamp-3">
                {recipe.title}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          {/* Title */}
          <h3
            className="font-playfair text-lg leading-snug text-[#201D20] line-clamp-2 group-hover:text-[#C58930] transition-colors duration-150"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {recipe.title}
          </h3>

          {/* Headline */}
          {recipe.headline && (
            <p className="text-sm text-[#6D5E6D] line-clamp-2 leading-relaxed flex-1">
              {recipe.headline}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#EBD2AD]">
            {/* Time */}
            <span className="flex items-center gap-1 text-sm text-[#6D5E6D]">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {recipe.total_time_minutes} min
            </span>

            {/* Diet badges */}
            <div className="flex items-center gap-1">
              {recipe.has_gluten_free && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EEF3EA] text-[#41622D] border border-[#B5C9A8]">
                  GF
                </span>
              )}
              {recipe.has_high_protein && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  HP
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
