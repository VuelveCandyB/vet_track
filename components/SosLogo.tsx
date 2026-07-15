'use client'

import Link from 'next/link'
import styles from './SosLogo.module.css'

type SosLogoProps = {
  href?: string
  onClick?: (e: React.MouseEvent) => void
}

export default function SosLogo({ href, onClick }: SosLogoProps) {
  // If onClick is provided, render as a span instead of Link (for use inside buttons)
  if (onClick) {
    return (
      <span className={styles.sosLogo} onClick={onClick} role="button" tabIndex={0}>
        <span className={styles.sosDot}>
          <span className={styles.ring} />
          <span className={styles.core} />
        </span>
        <span className={styles.sosText}>SOS</span>
      </span>
    )
  }

  // Otherwise render as Link
  return (
    <Link href={href || '/sos'} className={styles.sosLogo}>
      <span className={styles.sosDot}>
        <span className={styles.ring} />
        <span className={styles.core} />
      </span>
      <span className={styles.sosText}>SOS</span>
    </Link>
  )
}
