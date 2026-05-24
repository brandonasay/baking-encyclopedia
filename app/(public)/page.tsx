'use client'

import Link from 'next/link'

const sections = [
  {
    label: 'Recipes',
    href: '/recipes',
    description: 'Trusted recipes for every skill level',
    accent: '#C58930',
    bg: '#F5EAC8',
  },
  {
    label: 'How-To',
    href: '/how-to',
    description: 'Techniques and guides to bake better',
    accent: '#41622D',
    bg: '#EEF3EA',
  },
  {
    label: 'Ingredients',
    href: '/ingredients',
    description: 'Understand what every ingredient does',
    accent: '#41622D',
    bg: '#EEF3EA',
  },
]

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
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
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: '0 0 1rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          The Baking Encyclopedia
        </h1>
        <p
          style={{
            fontSize: '1.0625rem',
            color: 'var(--color-muted)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Your complete reference for recipes, ingredients, and techniques.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          width: '100%',
          maxWidth: '800px',
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
                  width: '40px',
                  height: '4px',
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
                  fontSize: '0.9rem',
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
