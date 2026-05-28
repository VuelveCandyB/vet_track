'use client'
import { useRouter } from 'next/navigation'

interface Props {
  action: () => Promise<void>
  message: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function ConfirmDeleteButton({ action, message, children, className, style }: Props) {
  const router = useRouter()

  async function handleClick() {
    if (!confirm(message)) return
    await action()
    router.refresh()
  }

  return (
    <button type="button" onClick={handleClick} className={className} style={style}>
      {children}
    </button>
  )
}
