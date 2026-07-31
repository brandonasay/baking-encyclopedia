import Link from 'next/link'

const recipeCategories = [
  { label: 'All Recipes', href: '/recipes' },
  { label: 'Breads & Loaves', href: '/recipes?category=breads' },
  { label: 'Cakes & Tortes', href: '/recipes?category=cakes' },
  { label: 'Pastry & Tarts', href: '/recipes?category=pastry' },
  { label: 'Cookies & Bars', href: '/recipes?category=cookies' },
]

const learnLinks = [
  { label: 'How-To Guides', href: '/how-to' },
  { label: 'Ingredient Glossary', href: '/ingredients' },
  { label: 'Baking Techniques', href: '/how-to?tag=techniques' },
  { label: 'Substitutions', href: '/how-to?tag=substitutions' },
]

const accountLinks = [
  { label: 'Sign In', href: '/?signin=1' },
  { label: 'My Account', href: '/account' },
  { label: 'Saved Recipes', href: '/account/saved' },
  { label: 'Grocery List', href: '/account/grocery-list' },
]

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem 2rem' }}>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-12 mb-12 text-center md:text-left">
          <div>
            <p
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: '0 0 0.5rem',
              }}
            >
              Baking Encyclopedia
            </p>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted)', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
              The complete reference for bakers.
            </p>
            <p
              className="hidden md:block"
              style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: 0, lineHeight: 1.7 }}
            >
              Trusted recipes, techniques, and ingredient guides — written for bakers at every level.
            </p>
          </div>

          <FooterColumn title="Recipes" links={recipeCategories} className="hidden md:block" />
          <FooterColumn title="Learn" links={learnLinks} className="hidden md:block" />
          <FooterColumn title="Account" links={accountLinks} />
        </div>

        <div
          className="flex flex-col md:flex-row items-center md:justify-between gap-3"
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1.5rem',
          }}
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: 0 }}>
            &copy; 2025 Baking Encyclopedia &middot; Presented by{' '}
            <a
              href="https://homebaked.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-muted)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
            >
              Homebaked
            </a>
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string
  links: { label: string; href: string }[]
  className?: string
}) {
  return (
    <div className={className}>
      <p
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 0.875rem',
        }}
      >
        {title}
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="footer-link"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
