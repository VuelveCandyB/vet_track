'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PALETTE } from '@/lib/palette'

interface MarkingsButtonProps {
  markings: any[]
}

export default function MarkingsButton({ markings }: MarkingsButtonProps) {
  const [open, setOpen] = useState(false)

  if (markings.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
        style={{ background: '#ec4899' + '20', color: '#ec4899', border: '1px solid #ec489940' }}>
        Marcas ({markings.length})
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" style={{ background: PALETTE.background.white, border: `1px solid ${PALETTE.ui.border}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: PALETTE.text.primary }}>Marcas Corporales ({markings.length})</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {markings.map((marking, idx) => (
              <div key={idx} className="border-l-4 pl-4 py-2" style={{ borderColor: '#ec4899' }}>
                <div className="font-semibold text-sm mb-2" style={{ color: PALETTE.text.primary }}>
                  Zona {marking.mark_part_id}
                </div>
                <div className="text-sm" style={{ color: PALETTE.text.secondary }}>
                  {marking.text1}
                  {marking.text2 && (
                    <>
                      <br />
                      <span className="text-xs italic">{marking.text2}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
