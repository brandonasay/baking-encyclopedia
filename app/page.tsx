'use client'

import Link from 'next/link'
import Image from 'next/image'

const sections = [
  { label: 'Recipes', href: '/recipes', color: '#C58930' },
  { label: 'How-To', href: '/how-to', color: '#201D20' },
  { label: 'Ingredients', href: '/ingredients', color: '#41622D' },
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
            fontSize: '1rem',
            color: 'var(--color-muted)',
            margin: '1rem auto 0',
            lineHeight: 1.6,
            maxWidth: '480px',
            textAlign: 'center',
          }}
        >
          Zero ads, zero clutter, free forever.
          <br /><br />
          The world&apos;s most complete resource for home bakers.
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
                backgroundColor: 'var(--color-bg)',
                border: '2px solid #EBD2AD',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.opacity = '0.75'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.opacity = '1'
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: section.color,
                  margin: 0,
                }}
              >
                {section.label}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '4rem',
        }}
      >
        <span style={{ fontSize: '1rem', color: 'var(--color-muted)' }}>From the creators of</span>
        <a href="https://homebakedapp.com/" target="_blank" rel="noopener noreferrer">
          <Image
            src="/homebaked-logo.png"
            alt="Homebaked"
            width={160}
            height={48}
            style={{ objectFit: 'contain', display: 'block' }}
            priority
          />
        </a>
      </div>
    </div>
  )
}
