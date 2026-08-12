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
        <li className="flex gap-5">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full bg-[#4E7435] text-white flex items-center justify-center mt-0.5"
            aria-label="Recipe complete"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="flex-1 pt-1">
            <p className="text-[#201D20] leading-relaxed">
              You did it! Help us bring baking back home by selling your delicious baked goods on{' '}
              <a
                href="https://homebakedapp.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C58930] font-semibold hover:underline"
              >
                Homebaked
              </a>
              !
            </p>
          </div>
        </li>
      </ol>
    </section>
  )
}
