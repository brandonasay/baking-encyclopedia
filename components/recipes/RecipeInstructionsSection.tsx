import type { RecipeInstruction } from '@/lib/database.types'

export function InstructionsSection({ instructions }: { instructions: RecipeInstruction[] }) {
  return (
    <section aria-labelledby="instructions-heading">
      <h2
        id="instructions-heading"
        className="text-2xl font-bold text-[#201D20] mb-6"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        Instructions
      </h2>
      <ol className="space-y-8">
        {instructions.map((step) => (
          <li key={step.step_number} className="flex gap-5">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full bg-[#C58930] text-white font-bold text-sm flex items-center justify-center mt-0.5"
              aria-label={`Step ${step.step_number}`}
            >
              {step.step_number}
            </div>
            <div className="flex-1 pt-1">
              {step.title && step.title.trim().toLowerCase() !== step.body.trim().toLowerCase() && (
                <h3 className="font-semibold text-[#201D20] mb-1.5">{step.title}</h3>
              )}
              <p className="text-[#201D20] leading-relaxed">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
