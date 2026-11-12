'use client'

import Link from 'next/link'
import Image from 'next/image'

const sections = [
  { label: 'Recipes', href: '/recipes', bg: '#C58930' },
  { label: 'How-To', href: '/how-to', bg: '#201D20' },
  { label: 'Ingredients', href: '/ingredients', bg: '#41622D' },
  { label: 'Baker Tools', href: '/baker-tools', bg: '#A64B2A' },
]

const platformComparisons = [
  { label: 'vs Bakesy', href: 'https://homebakedapp.com/compare/bakesy-alternative' },
  { label: 'vs Homegrown', href: 'https://homebakedapp.com/compare/homegrown-alternative' },
  { label: 'vs Hotplate', href: 'https://homebakedapp.com/compare/hotplate-alternative' },
  { label: 'vs My Custom Bakes', href: 'https://homebakedapp.com/compare/my-custom-bakes-alternative' },
  { label: 'vs Squarespace', href: 'https://homebakedapp.com/compare/squarespace-alternative-for-bakers' },
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
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1.25rem',
          width: '100%',
          maxWidth: '520px',
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
                backgroundColor: section.bg,
                cursor: 'pointer',
                transition: 'filter 0.15s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.filter = 'brightness(0.9)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.filter = 'none'
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: '#FCFFEB',
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
          gap: '1.25rem',
          marginTop: '4rem',
          width: '100%',
          maxWidth: '640px',
        }}
      >
        <div
          style={{
            padding: '0.875rem 1.75rem',
            borderRadius: '999px',
            backgroundColor: 'var(--color-amber-light)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            Looking to start a home bakery? Compare platforms.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.625rem',
          }}
        >
          {platformComparisons.map((comparison) => (
            <a
              key={comparison.href}
              href={comparison.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                padding: '0.625rem 1.125rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-amber)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)'
              }}
            >
              {comparison.label}
            </a>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '3rem',
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
