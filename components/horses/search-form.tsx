'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { PALETTE } from '@/lib/palette'

export default function SearchForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const [inputValue, setInputValue] = useState(q)

  // Sync input value when URL query changes
  useEffect(() => {
    setInputValue(q)
  }, [q])

  const handleClear = () => {
    router.push('/horses')
  }

  return (
    <TooltipProvider>
      <form method="get" className="mb-5 flex gap-3 w-full max-w-md items-center">
        <Input
          name="q"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Buscar por nombre o microchip..."
          className="flex-1"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4" style={{ color: PALETTE.text.secondary, cursor: 'help' }} />
          </TooltipTrigger>
          <TooltipContent>También puedes buscar por número de microchip</TooltipContent>
        </Tooltip>
        <Button type="submit" variant="secondary">Buscar</Button>
        {q && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
          >
            ✕
          </Button>
        )}
      </form>
    </TooltipProvider>
  )
}
