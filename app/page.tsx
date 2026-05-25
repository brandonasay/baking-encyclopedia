'use client'

import Link from 'next/link'

const sections = [
  {
    label: 'Recipes',
    href: '/recipes',
    description: 'Trusted recipes for every skill level',
    accent: '#C58930',
  },
  {
    label: 'How-To',
    href: '/how-to',
    description: 'Techniques and guides to bake better',
    accent: '#41622D',
  },
  {
    label: 'Ingredients',
    href: '/ingredients',
    description: 'Understand what every ingredient does',
    accent: '#41622D',
  },
]

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: '0 0 0.625rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Baking Encyclopedia
        </h1>
        <p
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          By Homebaked
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          width: '100%',
          maxWidth: '760px',
        }}
      >
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                padding: '2.25rem 2rem',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = section.accent
                el.style.boxShadow = `0 4px 24px ${section.accent}18`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'var(--color-border)'
                el.style.boxShadow = 'none'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: section.accent,
                  marginBottom: '1.25rem',
                }}
              />
              <p
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  margin: '0 0 0.5rem',
                }}
              >
                {section.label}
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-muted)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {section.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
