'use client'

import { useState } from 'react'

interface MonthlyTrafficChartProps {
  data: { month: string; views: number }[]
}

function formatMonthLabel(monthStr: string) {
  return new Date(monthStr).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
}

function formatMonthFull(monthStr: string) {
  return new Date(monthStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// Rounds up to a "clean" axis max (1/2/5 × a power of ten) so gridlines land on round numbers.
function niceMax(value: number) {
  if (value <= 0) return 10
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return niceNormalized * magnitude
}

// Rounded top corners, square baseline — SVG <rect rx> rounds all four corners, so
// this builds the path by hand per the mark spec (data-end rounded, baseline square).
function roundedTopBarPath(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, h, w / 2)
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`
}

export default function MonthlyTrafficChart({ data }: MonthlyTrafficChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (data.length === 0) {
    return <p className="text-sm text-[#6D5E6D]">No traffic data yet.</p>
  }

  const width = 720
  const height = 220
  const paddingLeft = 48
  const paddingRight = 8
  const paddingTop = 20
  const paddingBottom = 28
  const plotWidth = width - paddingLeft - paddingRight
  const plotHeight = height - paddingTop - paddingBottom

  const maxViews = niceMax(Math.max(...data.map((d) => d.views), 1))
  const gridFractions = [0, 0.25, 0.5, 0.75, 1]

  const barSlot = plotWidth / data.length
  const barWidth = Math.min(24, barSlot * 0.6)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Monthly page views">
        {gridFractions.map((f) => {
          const val = Math.round(maxViews * f)
          const y = paddingTop + plotHeight - f * plotHeight
          return (
            <g key={f}>
              <line x1={paddingLeft} x2={width - paddingRight} y1={y} y2={y} stroke="#EBD2AD" strokeWidth={1} />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#6D5E6D">
                {val.toLocaleString()}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const barHeight = Math.max((d.views / maxViews) * plotHeight, d.views > 0 ? 2 : 0)
          const x = paddingLeft + i * barSlot + (barSlot - barWidth) / 2
          const y = paddingTop + plotHeight - barHeight
          const isLast = i === data.length - 1
          const isHovered = hoverIndex === i
          return (
            <g key={d.month}>
              <path d={roundedTopBarPath(x, y, barWidth, barHeight, 4)} fill="#C58930" opacity={isHovered ? 1 : 0.85} />
              {isLast && (
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#201D20">
                  {d.views.toLocaleString()}
                </text>
              )}
              <text x={paddingLeft + i * barSlot + barSlot / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#6D5E6D">
                {formatMonthLabel(d.month)}
              </text>
              {/* Wider invisible hit target so hover isn't limited to the thin bar */}
              <rect
                x={paddingLeft + i * barSlot}
                y={paddingTop}
                width={barSlot}
                height={plotHeight}
                fill="transparent"
                style={{ pointerEvents: 'all' }}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          )
        })}
      </svg>

      {hoverIndex !== null && (
        <div
          className="absolute pointer-events-none bg-[#201D20] text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg whitespace-nowrap z-10"
          style={{
            left: `${((paddingLeft + hoverIndex * barSlot + barSlot / 2) / width) * 100}%`,
            top: 0,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold">{formatMonthFull(data[hoverIndex].month)}</div>
          <div>{data[hoverIndex].views.toLocaleString()} views</div>
        </div>
      )}
    </div>
  )
}
