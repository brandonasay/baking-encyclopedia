interface PexelsPhoto {
  src: { landscape: string; large: string; medium: string }
  alt: string | null
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[]
}

export interface StockImageResult {
  url: string
  alt: string
}

// Searches Pexels for a photo matching the query. Returns null if no key is
// configured, no match is found, or the request fails — callers should treat
// that as "leave the block for the admin to fill in manually," not an error.
export async function searchStockImage(query: string): Promise<StockImageResult | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey }, signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return null

    const json = (await res.json()) as PexelsSearchResponse
    const photo = json.photos?.[0]
    if (!photo) return null

    return {
      url: photo.src.landscape,
      alt: photo.alt || query,
    }
  } catch {
    return null
  }
}
