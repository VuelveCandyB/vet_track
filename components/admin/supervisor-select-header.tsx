'use client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default function SupervisorSelectHeader() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1 cursor-help">
            Supervisor <span className="text-[10px]">ⓘ</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="text-xs space-y-1">
            <div>Veterinario responsable de revisar los medicamentos que este técnico ingresa.</div>
            <div>Solo aplica a usuarios con rol Técnico.</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
