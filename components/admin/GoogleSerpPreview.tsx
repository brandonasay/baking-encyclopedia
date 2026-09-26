function truncate(text: string, max: number) {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

interface GoogleSerpPreviewProps {
  title: string
  fallbackTitle: string
  description: string
  fallbackDescription?: string
  urlSegments: string[]
}

export default function GoogleSerpPreview({ title, fallbackTitle, description, fallbackDescription, urlSegments }: GoogleSerpPreviewProps) {
  const effectiveTitle = title.trim() || fallbackTitle.trim() || 'Untitled'
  const effectiveDescription = description.trim() || fallbackDescription?.trim() || 'No description available.'

  return (
    <div>
      <p className="text-xs text-[#6D5E6D] mb-2">Google search result preview</p>
      <div className="bg-white border border-[#EBD2AD] rounded-lg p-4 max-w-xl" style={{ fontFamily: 'arial, sans-serif' }}>
        <div className="flex items-center gap-2.5 mb-1">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#C58930] text-white text-[11px] font-bold shrink-0">B</span>
          <div className="leading-tight min-w-0">
            <div className="text-[13px] text-[#202124]">Baking Encyclopedia</div>
            <div className="text-[12px] text-[#4d5156] truncate">
              bakingencyclopedia.com{urlSegments.length ? ' › ' + urlSegments.join(' › ') : ''}
            </div>
          </div>
        </div>
        <div className="text-[#1558d6] text-[18px] leading-snug truncate">{truncate(effectiveTitle, 60)}</div>
        <div className="text-[#4d5156] text-[14px] leading-snug mt-0.5 line-clamp-2">{truncate(effectiveDescription, 160)}</div>
      </div>
    </div>
  )
}
