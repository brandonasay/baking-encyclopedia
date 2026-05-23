import Link from 'next/link'
import Image from 'next/image'
import { Clock, ChefHat } from 'lucide-react'
import type { Recipe } from '@/lib/database.types'

type RecipeCardProps = {
  recipe: Pick<
    Recipe,
    | 'id'
    | 'slug'
    | 'title'
    | 'headline'
    | 'image_url'
    | 'difficulty'
    | 'total_time_minutes'
    | 'tags'
    | 'has_gluten_free'
    | 'has_high_protein'
  >
}

const difficultyConfig = {
  beginner: {
    label: 'Beginner',
    className: 'bg-green-100 text-green-800',
  },
  intermediate: {
    label: 'Intermediate',
    className: 'bg-amber-100 text-amber-800',
  },
  advanced: {
    label: 'Advanced',
    className: 'bg-red-100 text-red-800',
  },
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const difficulty = difficultyConfig[recipe.difficulty]
  const visibleTags = recipe.tags?.slice(0, 2) ?? []

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group block h-full"
      aria-label={recipe.title}
    >
      <article className="bg-white rounded-xl overflow-hidden border border-[#E8E0D5] h-full flex flex-col transition-shadow duration-200 hover:shadow-lg hover:shadow-[#C8652A]/10">
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5EDE4] to-[#E8D5C4] flex items-end p-4">
              <span className="font-playfair text-[#7A6A5E] text-sm leading-snug line-clamp-3">
                {recipe.title}
              </span>
            </div>
          )}

          {/* Difficulty badge overlay */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${difficulty.className}`}
            >
              <ChefHat className="w-3 h-3" aria-hidden="true" />
              {difficulty.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          {/* Title */}
          <h3
            className="font-playfair text-lg leading-snug text-[#1C1410] line-clamp-2 group-hover:text-[#C8652A] transition-colors duration-150"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {recipe.title}
          </h3>

          {/* Headline */}
          {recipe.headline && (
            <p className="text-sm text-[#7A6A5E] line-clamp-2 leading-relaxed flex-1">
              {recipe.headline}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#E8E0D5]">
            {/* Time */}
            <span className="flex items-center gap-1 text-sm text-[#7A6A5E]">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {recipe.total_time_minutes} min
            </span>

            {/* Diet badges */}
            <div className="flex items-center gap-1">
              {recipe.has_gluten_free && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
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

          {/* Tags */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs text-[#7A6A5E] bg-[#FAF8F4] border border-[#E8E0D5]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
