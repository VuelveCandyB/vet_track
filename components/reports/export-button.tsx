'use client'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import * as XLSX from 'xlsx'

interface ExportButtonProps {
  data: any[]
  filename: string
  disabled?: boolean
}

export default function ExportButton({ data, filename, disabled = false }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return

    // Preparar datos para exportar
    const exportData = data.map((row: any) => ({
      Caballo: row.horses?.name || '—',
      Medicamento: row.drugs?.nombre || '—',
      Categoría: row.drugs?.categoria || '—',
      Vía: row.drugs?.dosis_ruta || '—',
      Dosis: `${row.dosis}${row.dosis_unidad ? ` ${row.dosis_unidad}` : ''}`,
      Restricción: row.drugs?.tipo_restriccion || '—',
      Veterinario: row.vet_autorizado_nombre || '—',
      Fecha: row.fecha_tratamiento || '—',
      'Retiro (horas)': row.tiempo_restriccion || '—',
    }))

    // Crear workbook y worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Medicaciones')

    // Ajustar ancho de columnas
    const colWidths = [18, 18, 15, 12, 15, 15, 18, 15, 15]
    ws['!cols'] = colWidths.map(w => ({ wch: w }))

    // Descargar archivo
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <Button
      onClick={handleExport}
      disabled={disabled}
      size="sm"
      style={{
        background: disabled ? '#d1d5db' : PALETTE.primary.green,
        color: '#FFFFFF',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      📥 Exportar Excel
    </Button>
  )
}
