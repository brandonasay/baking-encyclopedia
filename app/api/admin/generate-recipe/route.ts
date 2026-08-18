import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

// Web-search research + a full recipe and gluten-free variant can genuinely
// take a while — without this, Vercel's default function timeout (as low as
// 10s on Hobby) kills the request before generation finishes.
export const maxDuration = 60

// The SDK's default timeout is 10 minutes — far longer than Vercel's 60s
// function limit above. If the connection to Anthropic stalls for any reason,
// leave this call an explicit, shorter timeout so it fails with a real,
// catchable error instead of silently hanging until Vercel kills the whole
// function with no useful error ever surfacing.
const anthropic = new Anthropic({ timeout: 45 * 1000 })

const RECIPE_SYSTEM_PROMPT = `You are a recipe developer for Baking Encyclopedia, a baking reference site. Given the name of a bake, you research it and produce one complete, original recipe as structured JSON.

## Research

Use web search to find at least 3 distinct existing recipes for the named bake. Look at their ratios, techniques, times, and yields to understand what a good version of this bake actually looks like. Then write your own original recipe informed by that research — never copy phrasing, ingredient lists, or instruction wording verbatim from any source. Every word of the instructions, tips, and headline should be written fresh, in your own clear, precise voice, like a knowledgeable friend talking someone through the bake. Save the technique explanations and "why" for the instructions and tips — the ingredient list itself should read like an ingredient list (see below), not prose.

## Every ingredient needs both unit systems

For every ingredient, in both the base recipe and the gluten-free variant, provide:
- \`quantity\`: a plain string in cups/tablespoons/teaspoons (e.g. "1 1/2", "2", "1/4") — or the ingredient's natural unit if it's normally sold/measured by weight or count (e.g. chocolate chips by cup is fine, but something like "2 large eggs" uses quantity "2", unit "large eggs")
- \`unit\`: the matching unit word (e.g. "cups", "tablespoons", "teaspoons", "large eggs")
- \`quantity_grams\`: a number — the actual gram weight of that exact quantity, computed precisely, not a rough guess

Use standard baking weight conversions and apply them consistently:
- All-purpose flour: ~120g/cup
- Granulated sugar: ~200g/cup
- Brown sugar, packed: ~213g/cup
- Powdered sugar: ~120g/cup
- Butter: ~227g/cup, ~14g/tablespoon
- Large egg: ~50g each
- Milk or water: ~240g/cup
- Salt, baking powder, baking soda: ~4-6g/teaspoon

For anything not listed, apply your general knowledge of ingredient density consistently. Always derive \`quantity_grams\` by actually multiplying the per-unit weight by the quantity — never pick an arbitrary round number.

## Keep ingredient lines short

\`ingredient_name\` is the plain name of the ingredient, optionally with a short, standard prep descriptor where the prep genuinely matters (e.g. "Unsalted butter, melted and cooled", "Dark brown sugar, packed") — that's normal, keep it.

\`notes\` is different and almost always empty. It exists only for a short (2-4 word) qualifier that doesn't fit in the name, like "room temperature" or "optional". **Never write a sentence, an explanation, or the reasoning behind an ingredient in \`notes\`** — no "this is what gives the cookies their crisp edges," no substitution advice, no technique tips. That content belongs in \`tips\` or the instructions, not repeated on every ingredient line. If an ingredient doesn't need a qualifier, leave \`notes\` as an empty string.

## Gluten-free variant

Generate a complete, original gluten-free variant — a full parallel ingredient list and instruction list with the same gram-conversion rigor and the same short-\`notes\` rule as the base recipe:
- Substitute wheat flour with a 1:1 cup-for-cup gluten-free flour blend.
- If that blend type doesn't reliably include a binder, add xanthan gum as its own ingredient line (roughly 1/2 teaspoon per cup of flour replaced).
- Only change instruction steps where gluten-free technique genuinely differs (e.g. letting gluten-free batter rest 20-30 minutes to hydrate starches, different doneness cues) — don't rewrite steps that don't actually change. If there's something a baker genuinely needs to know (a resting time, a texture cue), put it in the relevant instruction step itself.
- Always set \`gluten_free_notes\` to an empty string "". Do not write a paragraph of substitution advice, hidden-gluten warnings, or explanation there — the page renders this field as a prominent banner, and it should not appear at all. Anything worth telling the baker belongs in the instructions or \`tips\`, not this field.

## Other fields

- \`image_url\` must always be the empty string "" — you cannot source or generate a real photo, and a fabricated URL would break the page. Leave this for the admin to upload separately.
- \`seo_title\` and \`seo_description\` (150-160 characters) should be written for what someone would actually search for.
- \`tags\` should be genuinely useful search/filter terms for this bake.
- \`difficulty\` is one of "beginner", "intermediate", or "advanced".

## Output format

End your response with nothing but a single JSON object matching this exact shape:

{
  "title": string,
  "headline": string (1-2 sentences),
  "prep_time_minutes": number | null,
  "cook_time_minutes": number | null,
  "base_yield": string (e.g. "12 muffins"),
  "base_servings": number | null,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "ingredients": [{ "ingredient_name": string, "quantity": string, "unit": string, "quantity_grams": number, "notes": string, "group_label": string }],
  "instructions": [{ "step_number": number, "title": string, "body": string }],
  "tips": string[],
  "equipment": string[],
  "storage_instructions": string,
  "tags": string[],
  "has_gluten_free": true,
  "gluten_free_notes": "",
  "gluten_free_ingredients": [{ "ingredient_name": string, "quantity": string, "unit": string, "quantity_grams": number, "notes": string, "group_label": string }],
  "gluten_free_instructions": [{ "step_number": number, "title": string, "body": string }],
  "seo_title": string,
  "seo_description": string,
  "image_url": ""
}`

function extractRecipeJson(content: Anthropic.ContentBlock[]): unknown {
  const text = content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude returned no JSON')
  return JSON.parse(jsonMatch[0])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { topic } = (await request.json()) as { topic?: string }
  if (!topic || !topic.trim()) return Response.json({ error: 'topic is required' }, { status: 400 })

  console.log(`[generate-recipe] Starting generation for "${topic.trim()}"`)

  try {
    let messages: Anthropic.MessageParam[] = [
      { role: 'user', content: `Recipe to research and create: ${topic.trim()}` },
    ]

    const genStart = Date.now()
    let message = await anthropic.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: RECIPE_SYSTEM_PROMPT,
      // Deployed on Vercel Hobby's 60s function limit — keep effort/search scope
      // tight enough that generation reliably finishes in time. Effort "medium"
      // trades some open-ended deliberation for speed; the prompt is detailed
      // enough that this shouldn't cost gram-math accuracy.
      output_config: { effort: 'medium' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
      messages,
    })

    // The server-side web search loop caps at 10 iterations; if research is still
    // in progress, resume by re-sending the paused turn (up to 2 continuations).
    let continuations = 0
    while (message.stop_reason === 'pause_turn' && continuations < 2) {
      messages = [...messages, { role: 'assistant', content: message.content }]
      message = await anthropic.messages.create({
        model: 'claude-opus-5',
        max_tokens: 16000,
        system: RECIPE_SYSTEM_PROMPT,
        output_config: { effort: 'medium' },
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4 }],
        messages,
      })
      continuations++
    }

    console.log(`[generate-recipe] Claude generation took ${Date.now() - genStart}ms (${continuations} continuation${continuations === 1 ? '' : 's'})`)

    if (message.stop_reason === 'refusal') {
      throw new Error('Claude declined to generate this recipe')
    }

    const parsed = extractRecipeJson(message.content) as Record<string, unknown>
    if (!parsed.title || !Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) {
      throw new Error('Could not parse a recipe from the model response')
    }

    // Best-effort: link generated ingredients to existing ingredients-table
    // entries by a plain-code whole-word match against ingredient_name — no
    // extra AI output required, so this adds no generation latency. Never
    // blocks generation. Hard 5s timeout so a slow/hanging DB call can never
    // stall the response.
    const matchStart = Date.now()
    try {
      const { data: allIngredients } = await supabaseAdmin
        .from('ingredients')
        .select('id, name')
        .abortSignal(AbortSignal.timeout(5000))
      const candidates = (allIngredients ?? []).map((row) => ({ id: row.id, name: row.name.trim().toLowerCase() }))

      const findMatch = (ingredientName: string): string | undefined => {
        const haystack = ingredientName.toLowerCase()
        const matches = candidates.filter((c) => {
          const escaped = c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          return new RegExp(`\\b${escaped}\\b`).test(haystack)
        })
        if (matches.length === 0) return undefined
        const longestLength = Math.max(...matches.map((m) => m.name.length))
        const longestMatches = matches.filter((m) => m.name.length === longestLength)
        // Only link when exactly one candidate is the most specific match —
        // an ambiguous tie is worse than no link.
        return longestMatches.length === 1 ? longestMatches[0].id : undefined
      }

      const matchList = (list: unknown) => {
        if (!Array.isArray(list)) return
        for (const ing of list as Record<string, unknown>[]) {
          const name = typeof ing.ingredient_name === 'string' ? ing.ingredient_name : ''
          const matchId = name ? findMatch(name) : undefined
          if (matchId) ing.ingredient_id = matchId
        }
      }

      matchList(parsed.ingredients)
      matchList(parsed.gluten_free_ingredients)
      console.log(`[generate-recipe] Ingredient matching took ${Date.now() - matchStart}ms`)
    } catch (matchErr) {
      // Matching is best-effort — never let it block recipe generation.
      console.log(`[generate-recipe] Ingredient matching failed after ${Date.now() - matchStart}ms:`, (matchErr as Error).message)
    }

    return Response.json({ data: parsed })
  } catch (err) {
    console.log(`[generate-recipe] Failed:`, (err as Error).name, (err as Error).message)
    return Response.json({ error: `Generation failed: ${(err as Error).message}` }, { status: 500 })
  }
}
