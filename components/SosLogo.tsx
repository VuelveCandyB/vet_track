'use client'

import Link from 'next/link'
import styles from './SosLogo.module.css'

type SosLogoProps = {
  href?: string
  onClick?: (e: React.MouseEvent) => void
}

export default function SosLogo({ href, onClick }: SosLogoProps) {
  const buoyContent = (
    <>
      <span className={styles.buoyWrap}>
        <span className={styles.sonar} />
        <svg width="22" height="22" viewBox="0 0 40 40" style={{ position: 'relative' }}>
          <circle cx="20" cy="20" r="17" fill="none" stroke="white" strokeWidth="4.5" />
          <circle cx="20" cy="20" r="6.5" fill="none" stroke="white" strokeWidth="2.5" />
          <line x1="20" y1="3" x2="20" y2="10.5" stroke="#1f9d6b" strokeWidth="4.5" />
          <line x1="20" y1="29.5" x2="20" y2="37" stroke="#1f9d6b" strokeWidth="4.5" />
          <line x1="3" y1="20" x2="10.5" y2="20" stroke="#1f9d6b" strokeWidth="4.5" />
          <line x1="29.5" y1="20" x2="37" y2="20" stroke="#1f9d6b" strokeWidth="4.5" />
        </svg>
      </span>
      <span className={styles.sosText} style={{ color: 'white' }}>SOS</span>
    </>
  )

  // If onClick is provided, render as a span instead of Link (for use inside buttons)
  if (onClick) {
    return (
      <span className={styles.sosLogo} onClick={onClick} role="button" tabIndex={0}>
        {buoyContent}
      </span>
    )
  }

  // Otherwise render as Link
  return (
    <Link href={href || '/sos'} className={styles.sosLogo}>
      {buoyContent}
    </Link>
  )
}
