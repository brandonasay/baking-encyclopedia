import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// Temporary diagnostic route: a bare, tool-free Claude call to measure the
// account's current baseline latency, isolated from web search and large
// JSON output. Delete once the generation timeout issue is resolved.
export const maxDuration = 30

const anthropic = new Anthropic()

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const controller = new AbortController()
  const abortTimer = setTimeout(() => controller.abort(), 25 * 1000)

  const start = Date.now()
  try {
    const message = await anthropic.messages.create(
      {
        model: 'claude-opus-5',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Reply with just the word OK.' }],
      },
      { signal: controller.signal }
    )
    const durationMs = Date.now() - start
    console.log(`[test-claude] Completed in ${durationMs}ms`)
    const text = message.content.find((b) => b.type === 'text')?.text ?? ''
    return Response.json({ durationMs, stopReason: message.stop_reason, text })
  } catch (err) {
    const durationMs = Date.now() - start
    console.log(`[test-claude] Failed after ${durationMs}ms:`, (err as Error).name, (err as Error).message)
    return Response.json(
      { error: `${(err as Error).message}`, durationMs },
      { status: 500 }
    )
  } finally {
    clearTimeout(abortTimer)
  }
}
