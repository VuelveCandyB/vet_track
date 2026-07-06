'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function DownloadCSVTemplate() {
  const handleDownload = () => {
    const csvContent = `horse_name,horse_id,race_number,post_time,trainer,owner
THUNDERBOLT,840003123456789,7,14:30,García José,Rivera Stables
GOLDEN DREAM,840003987654321,7,14:30,López María,Establo San Juan
MIDNIGHT RUNNER,840003555666777,8,15:00,Rodríguez Carlos,Camarero Partners
SILVER BULLET,840003111222333,8,15:00,Martínez Ana,Family Farm
LIGHTNING STRIKE,840003444555666,9,15:30,Pérez Juan,Stables United`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'race_day_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Descargar Template
    </Button>
  )
}
