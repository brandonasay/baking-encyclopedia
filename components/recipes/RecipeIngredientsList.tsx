import type { RecipeIngredient } from '@/lib/database.types'

export function IngredientsList({ ingredients }: { ingredients: RecipeIngredient[] }) {
  // Group by group_label
  const groups: { label: string | null; items: RecipeIngredient[] }[] = []
  for (const ing of ingredients) {
    const label = ing.group_label ?? null
    const existing = groups.find((g) => g.label === label)
    if (existing) {
      existing.items.push(ing)
    } else {
      groups.push({ label, items: [ing] })
    }
  }

  return (
    <div className="space-y-5">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A5E] mb-3">
              {group.label}
            </h3>
          )}
          <ul className="space-y-2.5">
            {group.items.map((ing, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm">
                <span
                  className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#C8652A] mt-1.5"
                  aria-hidden="true"
                />
                <span>
                  <span className="font-medium text-[#1C1410]">
                    {ing.quantity} {ing.unit}
                  </span>{' '}
                  <span className="text-[#1C1410]">{ing.ingredient_name}</span>
                  {ing.notes && <span className="text-[#7A6A5E]">, {ing.notes}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
