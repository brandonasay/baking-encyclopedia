'use client'

// Fire-and-forget event tracking for the calculator — no personal data in
// properties. Posts to a server route (service-role write, same pattern as
// the site's existing page_views tracker) rather than writing to
// calc_events directly from the client, so no client RLS policy is needed.
export function trackCalcEvent(eventName: string, properties: Record<string, unknown> = {}): void {
  try {
    const body = JSON.stringify({ event_name: eventName, properties, session_id: getSessionId() })
    const blob = new Blob([body], { type: 'application/json' })
    if (!navigator.sendBeacon?.('/api/calc/track', blob)) {
      fetch('/api/calc/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    }
  } catch {
    // Analytics must never break the app.
  }
}

function getSessionId(): string {
  try {
    const key = 'be-calc-session-id'
    let id = window.localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      window.localStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}
