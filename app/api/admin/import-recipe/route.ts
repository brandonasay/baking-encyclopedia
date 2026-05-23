import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { RecipeIngredient, RecipeInstruction } from '@/lib/database.types'

const anthropic = new Anthropic()

function parseIsoDuration(iso: string | undefined): number | null {
  if (!iso) return null
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return null
  return (parseInt(match[1] ?? '0') * 60) + parseInt(match[2] ?? '0') || null
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000)
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = scriptRe.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1])
      const candidates: unknown[] = []
      if (Array.isArray(parsed)) candidates.push(...parsed)
      else if (parsed?.['@graph']) candidates.push(...parsed['@graph'])
      else candidates.push(parsed)
      const recipe = candidates.find((c: unknown) =>
        (c as Record<string, unknown>)?.['@type'] === 'Recipe' ||
        (Array.isArray((c as Record<string, unknown>)?.['@type']) &&
          ((c as Record<string, unknown>)['@type'] as string[]).includes('Recipe'))
      )
      if (recipe) return recipe as Record<string, unknown>
    } catch {}
  }
  return null
}

function mapJsonLd(ld: Record<string, unknown>) {
  const rawInstructions = (ld.recipeInstructions ?? []) as unknown[]
  const instructions: RecipeInstruction[] = []
  let step = 1
  const addStep = (title: string | undefined, body: string) => {
    instructions.push({ step_number: step++, title: title || undefined, body })
  }
  for (const item of rawInstructions) {
    if (typeof item === 'string') { addStep(undefined, item); continue }
    const obj = item as Record<string, unknown>
    if (obj['@type'] === 'HowToSection') {
      for (const sub of (obj.itemListElement ?? []) as Record<string, unknown>[]) {
        addStep(sub.name as string, (sub.text ?? sub.description ?? '') as string)
      }
    } else {
      addStep(obj.name as string, (obj.text ?? obj.description ?? '') as string)
    }
  }

  const rawIngredients = (ld.recipeIngredient ?? []) as string[]
  const ingredients: RecipeIngredient[] = rawIngredients.map(ing => ({
    ingredient_name: ing,
    quantity: '',
    unit: '',
  }))

  const imageRaw = ld.image
  const imageUrl =
    typeof imageRaw === 'string' ? imageRaw
    : Array.isArray(imageRaw) ? (imageRaw[0] as string)
    : (imageRaw as Record<string, unknown>)?.url as string ?? ''

  const keywords = (ld.keywords as string | undefined)?.split(',').map(k => k.trim()).filter(Boolean) ?? []

  return {
    title: (ld.name ?? '') as string,
    headline: (ld.description ?? '') as string,
    prep_time_minutes: parseIsoDuration(ld.prepTime as string),
    cook_time_minutes: parseIsoDuration(ld.cookTime as string),
    base_yield: Array.isArray(ld.recipeYield) ? String(ld.recipeYield[0]) : String(ld.recipeYield ?? ''),
    ingredients,
    instructions,
    tags: keywords,
    image_url: imageUrl,
  }
}

async function extractWithClaude(pageText: string, url: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Extract the recipe from this page and return ONLY valid JSON — no markdown, no explanation.

Rewrite the instructions in your own clear, precise voice. Do not copy text verbatim.

Return this exact shape:
{
  "title": string,
  "headline": string (1-2 sentence description),
  "prep_time_minutes": number | null,
  "cook_time_minutes": number | null,
  "base_yield": string (e.g. "12 muffins"),
  "base_servings": number | null,
  "ingredients": [{ "ingredient_name": string, "quantity": string, "unit": string, "notes": string, "group_label": string }],
  "instructions": [{ "step_number": number, "title": string, "body": string }],
  "tips": string[],
  "equipment": string[],
  "storage_instructions": string,
  "tags": string[],
  "image_url": string
}

Page URL: ${url}

Page text:
${pageText}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
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

  const { url } = await request.json() as { url: string }
  if (!url) return Response.json({ error: 'url is required' }, { status: 400 })

  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    return Response.json({ error: `Could not fetch URL: ${(err as Error).message}` }, { status: 422 })
  }

  // Fast path: JSON-LD
  const ld = extractJsonLd(html)
  if (ld) {
    return Response.json({ data: mapJsonLd(ld), source: 'json-ld' })
  }

  // Slow path: Claude
  try {
    const pageText = stripHtml(html)
    const data = await extractWithClaude(pageText, url)
    return Response.json({ data, source: 'claude' })
  } catch (err) {
    return Response.json({ error: `Extraction failed: ${(err as Error).message}` }, { status: 500 })
  }
}
