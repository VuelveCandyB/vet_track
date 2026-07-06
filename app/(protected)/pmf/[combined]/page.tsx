"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ArrowLeft, Info } from "lucide-react"
import { getPMFData, createPMFRecord, signPMFAsVetOficial, signPMFAsRepresentante, certifyPMFRecord } from "@/lib/actions/pmf"
import { useAuth } from "@/hooks/use-auth"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { registerHorseInLOES } from "@/lib/actions/horse"

export default function PMFPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  // Extract IDs safely once and memoize them
  const { raceDayId, entryId } = useMemo(() => {
    const combined = params.combined as string
    if (!combined) return { raceDayId: null, entryId: null }
    const [raceId, entryIdVal] = combined.split("_")
    return { raceDayId: raceId, entryId: entryIdVal }
  }, [params.combined])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pmfData, setPMFData] = useState<any>(null)
  const [pmfRecordId, setPMFRecordId] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [dosisRecetada, setDosisRecetada] = useState(500)
  const [horaEntregaReceta, setHoraEntregaReceta] = useState("09:00")
  const [fechaAdmin, setFechaAdmin] = useState(new Date().toISOString().split("T")[0])
  const [horaAdmin, setHoraAdmin] = useState(new Date().toTimeString().slice(0, 5))
  const [dosisAdministrada, setDosisAdministrada] = useState(500)
  const [viaAdmin, setViaAdmin] = useState("IV")
  const [agujaCorporea, setAgujaCorporea] = useState(false)
  const [repNombre, setRepNombre] = useState("")
  const [vetOficialSigned, setVetOficialSigned] = useState(false)
  const [representanteSigned, setRepresentanteSigned] = useState(false)
  const [pmfCertified, setPMFCertified] = useState(false)
  const [registringLOES, setRegisteringLOES] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!entryId || !raceDayId) {
        setError("Invalid parameters")
        setLoading(false)
        return
      }

      setLoading(true)
      const result = await getPMFData(entryId, raceDayId)
      if (result.success) {
        setPMFData(result)
      } else {
        setError(result.error || "Failed to load PMF data")
      }
      setLoading(false)
    }
    load()
  }, [entryId, raceDayId])

  const validateEarlyChecks = async (): Promise<string[]> => {
    const errors: string[] = []

    // TODO: Check 1: Hora receta < 12:00 PM (disabled temporarily)
    // if (horaEntregaReceta) {
    //   const [horas, minutos] = horaEntregaReceta.split(':').map(Number)
    //   if (horas >= 12) {
    //     errors.push("❌ Receta debe ser entregada ANTES de las 12:00 PM (Art. 1407)")
    //   }
    // }

    // Check 2: Caballo en LOES
    if (pmfData?.horse && !pmfData.horse.en_loes) {
      errors.push("❌ Caballo NO está registrado en LOES (Art. 1406)")
    }

    // Check 3: Dosis válida
    if (dosisRecetada < 100 || dosisRecetada > 500) {
      errors.push("❌ Dosis recetada fuera de rango 100-500 mg (Art. 1408)")
    }

    return errors
  }

  const handleRegisterAndSign = async () => {
    if (!user) {
      setError("Usuario no autenticado")
      return
    }

    // Early validation
    const earlyErrors = await validateEarlyChecks()
    if (earlyErrors.length > 0) {
      setError(`Corrige estos errores primero:\n${earlyErrors.join('\n')}`)
      return
    }

    setSigning(true)
    setError(null)

    try {
      const result = await createPMFRecord({
        raceEntryId: entryId!,
        dosisRecetada,
        horaEntregaReceta: new Date(`2000-01-01T${horaEntregaReceta}`).toISOString(),
        fechaAdmin,
        horaAdmin,
        dosisAdministrada,
        viaAdmin,
        agujaCorporea,
        vetOficialId: user.id,
        vetOficialNombre: user.email || "Vet Oficial",
        repNombre: repNombre || undefined,
      })

      if (!result.success) {
        setError(result.error || "Failed to create PMF")
        setSigning(false)
        return
      }

      setPMFRecordId(result.pmfRecord.id)

      const signResult = await signPMFAsVetOficial(
        result.pmfRecord.id,
        user.id,
        user.email || "Vet Oficial"
      )

      if (signResult.success) {
        setVetOficialSigned(true)
        setSuccess("✓ PMF registrado y firmado")
      } else {
        setError("Failed to sign")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
    setSigning(false)
  }

  const handleSignRepresentante = async () => {
    if (!pmfRecordId || !repNombre) {
      setError("Ingresa nombre del Representante")
      return
    }

    setSigning(true)
    setError(null)

    try {
      const result = await signPMFAsRepresentante(pmfRecordId, repNombre)

      if (result.success) {
        setRepresentanteSigned(true)
        setSuccess("✓ Firmado por Representante")
      } else {
        setError(result.error || "Failed to sign")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
    setSigning(false)
  }

  const handleRegisterLOES = async () => {
    if (!pmfData?.horse?.id) {
      setError("Caballo no encontrado")
      return
    }

    setRegisteringLOES(true)
    setError(null)

    try {
      const result = await registerHorseInLOES(pmfData.horse.id)

      if (result.success) {
        setSuccess("✓ Caballo registrado en LOES")
        // Reload data
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setError(result.error || "Failed to register horse in LOES")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
    setRegisteringLOES(false)
  }

  const handleCertify = async () => {
    if (!pmfRecordId || !vetOficialSigned || !representanteSigned) {
      setError("Ambas firmas requeridas")
      return
    }

    setSigning(true)
    setError(null)

    try {
      const result = await certifyPMFRecord(pmfRecordId)

      if (result.success) {
        setPMFCertified(true)
        setSuccess("✓ PMF Certificado")
      } else {
        // Show validation errors with details
        if ((result as any).validationErrors && (result as any).validationErrors.length > 0) {
          setError(`Errores de validación:\n• ${(result as any).validationErrors.join('\n• ')}`)
        } else {
          setError(result.error || "Failed to certify")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
    setSigning(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-slate-600">Cargando PMF...</div>
      </div>
    )
  }

  if (!pmfData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => {
            router.back()
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "No data found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Block access if horse is NOT in LOES
  if (!pmfData?.horse?.en_loes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>

          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Acceso Bloqueado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-red-900">
                  {pmfData?.entry?.horse_nombre_csv}
                </p>
                <p className="text-red-700 mt-2">
                  Este caballo NO está registrado en LOES (Lista Oficial de Ejemplares Sangradores).
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Según Art. 1406, solo caballos sangradores registrados pueden recibir PMF.
                </p>
              </div>

              <Button
                onClick={handleRegisterLOES}
                disabled={registringLOES}
                style={{ background: "#059669", color: "white" }}
                className="w-full"
              >
                {registringLOES ? "⏳ Registrando..." : "✓ Registrar en LOES"}
              </Button>

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            router.back()
          }}
          className="text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">Administración PMF</h1>
          <p className="text-slate-600 mt-2">
            <span className="font-semibold">{pmfData?.entry?.horse_nombre_csv}</span> — Carrera {pmfData?.entry?.num_carrera}
          </p>

          {/* LOES Status */}
          <div className="mt-4 p-3 rounded-lg border-2 flex items-center gap-3"
               style={{
                 backgroundColor: pmfData?.horse?.en_loes ? '#f0fdf4' : '#fef2f2',
                 borderColor: pmfData?.horse?.en_loes ? '#86efac' : '#fca5a5'
               }}>
            {pmfData?.horse?.en_loes ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">✓ Caballo en LOES</p>
                  <p className="text-sm text-green-700">Registrado desde {pmfData.horse.fecha_ingreso_loes ? new Date(pmfData.horse.fecha_ingreso_loes).toLocaleDateString('es-PR') : 'desconocido'}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">⚠️ NO está en LOES</p>
                  <p className="text-sm text-red-700">Debe registrarse para administrar PMF (Art. 1406)</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleRegisterLOES}
                  disabled={registringLOES}
                  style={{ background: "#dc2626", color: "white" }}
                >
                  {registringLOES ? "Registrando..." : "Registrar en LOES"}
                </Button>
              </>
            )}
          </div>
        </div>

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}

        {!pmfRecordId ? (
          <Card>
            <CardHeader>
              <CardTitle>Registro de Furosemida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium">Dosis Recetada (mg)</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Art. 1408: Entre 100-500 mg. Recetada por vet autorizado.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    value={dosisRecetada}
                    onChange={(e) => setDosisRecetada(Number(e.target.value))}
                    min="100"
                    max="500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium">Hora Entrega Receta</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Art. 1407: Debe entregarse ANTES de las 12:00 PM.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    type="time"
                    value={horaEntregaReceta}
                    onChange={(e) => setHoraEntregaReceta(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium">Fecha Admin</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Art. 1406: Día de administración del fármaco.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    type="date"
                    value={fechaAdmin}
                    onChange={(e) => setFechaAdmin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium">Hora Admin</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Art. 1406: Mínimo 4 horas antes de la carrera.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    type="time"
                    value={horaAdmin}
                    onChange={(e) => setHoraAdmin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium">Dosis Admin (mg)</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Art. 1408: Entre 100-500 mg. Debe coincidir con dosis recetada.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    type="number"
                    value={dosisAdministrada}
                    onChange={(e) => setDosisAdministrada(Number(e.target.value))}
                    min="100"
                    max="500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium">Vía</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-slate-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Art. 1408, 1410: Siempre intravenosa (IV). No editable.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <select
                    value={viaAdmin}
                    onChange={(e) => setViaAdmin(e.target.value)}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50"
                  >
                    <option value="IV">IV (Intravenosa)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aguja"
                  checked={agujaCorporea}
                  onChange={(e) => setAgujaCorporea(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="aguja" className="text-sm font-medium flex items-center gap-2">
                  Aguja desechable confirmada
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Art. 1410: Aguja nueva desechable de un solo uso REQUERIDA.
                    </TooltipContent>
                  </Tooltip>
                </label>
              </div>

              <Button
                onClick={handleRegisterAndSign}
                disabled={signing}
                className="w-full"
                style={{ background: "#059669", color: "#fff" }}
              >
                {signing ? "⏳ Registrando..." : "✓ Registrar"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {pmfRecordId && (
          <Card>
            <CardHeader>
              <CardTitle>Firmas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Vet Oficial {vetOficialSigned && "✓"}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium">Representante</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-slate-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Art. 1412c: Dueño, entrenador o mozo presente en la administración.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <input
                  type="text"
                  value={repNombre}
                  onChange={(e) => setRepNombre(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mb-2"
                  disabled={representanteSigned}
                />
                <Button
                  onClick={handleSignRepresentante}
                  disabled={signing || !repNombre || representanteSigned}
                  variant="outline"
                  className="w-full"
                >
                  {representanteSigned ? "✓ Firmado" : "Firmar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {pmfRecordId && vetOficialSigned && representanteSigned && !pmfCertified && (
          <Button
            onClick={handleCertify}
            disabled={signing}
            className="w-full"
            style={{ background: "#059669", color: "#fff" }}
          >
            {signing ? "⏳ Certificando..." : "✓ Certificar PMF"}
          </Button>
        )}

        {pmfCertified && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">PMF Certificado</h3>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </TooltipProvider>
  )
}
