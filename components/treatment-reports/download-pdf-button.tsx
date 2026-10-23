'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PALETTE } from '@/lib/palette'
import { buildTreatmentReportPdf, type PdfMedication, type PdfReport } from '@/lib/pdf/treatment-report-pdf'

interface DownloadPdfButtonProps {
  report: PdfReport
  medications?: PdfMedication[]
}

export default function DownloadPdfButton({ report, medications = [] }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      const pdf = await buildTreatmentReportPdf(report, medications)

      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—'
        const [year, month, day] = dateStr.split('-')
        return `${day}/${month}/${year}`
      }

      const filename = `Informe-${report.horse?.name || 'Caballo'}-${formatDate(report.fecha_tratamiento)}.pdf`
      pdf.save(filename)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      style={{ background: PALETTE.primary.green, color: '#fff' }}
      className="text-sm">
      {isGenerating ? 'Generando PDF...' : '📄 Descargar PDF'}
    </Button>
  )
}
