'use client'
import { useState } from 'react'
import { getVaccinationPdfUrl } from '@/lib/actions/vaccinations'
import { PALETTE } from '@/lib/palette'

interface Props {
  vaccinationId: string
  pdfPath?: string
  pdfName?: string
}

export default function VaccinationPdfButton({ vaccinationId, pdfPath, pdfName }: Props) {
  const [loading, setLoading] = useState(false)

  if (!pdfPath) return null

  async function handleDownload() {
    try {
      setLoading(true)
      const url = await getVaccinationPdfUrl(vaccinationId, pdfPath!)
      window.open(url, '_blank')
    } catch (error) {
      alert('Error al descargar PDF')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="text-xs px-2 py-1 rounded-md transition-colors"
      style={{
        background: PALETTE.primary.green,
        color: '#FFFFFF',
        opacity: loading ? 0.7 : 1,
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
      title={pdfName}>
      {loading ? '⏳' : '📄'}
    </button>
  )
}
