# FLUJO COMPLETO: Certificación de Caballos Sangradores (LOES) y PMF

**Basado en:** Reglamento 8760, Artículos 1001-1415, 2801-2805

---

## **FASE 1: DETECCIÓN Y REPORTE (VETERINARIO PRIVADO)**

### Escenario: Caballo muestra sangrado después de ejercicio/carrera

```
┌─────────────────────────────────────────────────────────────┐
│ EVENTO: Caballo muestra hemorragia pulmonar con epistaxis   │
│ (sangre por nariz después de ejercicio o carrera)           │
│                                                              │
│ Detectado por: VETERINARIO PRIVADO (Autorizado)             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ VET PRIVADO ACCIONES:                                        │
│                                                              │
│ 1. Examina al caballo                                        │
│ 2. Documenta tipo de hemorragia:                             │
│    • Epistaxis unilateral (sangre por una nariz)             │
│    • Epistaxis bilateral (sangre por ambas narices)          │
│    • Hemorragia traqueal (vía endoscopia)                    │
│ 3. Toma fotos/videos como evidencia                          │
│ 4. Contacta INMEDIATAMENTE al Vet Oficial                    │
│ 5. Notifica al Dueño/Entrenador                              │
└─────────────────────────────────────────────────────────────┘
```

**Documentos generados:**
- 📋 Reporte de observación clínica (privado, sin firmas aún)

---

## **FASE 2: CERTIFICACIÓN OFICIAL (VETERINARIO OFICIAL)**

### Paso 2A: Verificación por Vet Oficial

```
┌─────────────────────────────────────────────────────────────┐
│ VET OFICIAL RECIBE NOTIFICACIÓN DEL VET PRIVADO             │
│                                                              │
│ Acciones:                                                    │
│ 1. Examina al caballo nuevamente (confirmación)              │
│ 2. Verifica evidencia de hemorragia:                         │
│    • Presencia visible (epistaxis)                           │
│    • Examen endoscópico si es necesario                      │
│ 3. Revisa que sea:                                           │
│    • Línea de sangre CONTINUA (no fragmentada)               │
│    • En tráquea (si es endoscopia)                           │
│ 4. Documenta hallazgos clínicos                              │
│ 5. Decide: ¿Cumple criterios para LOES?                     │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ SÍ → Procede a Fase 2B
         └─ NO → Rechaza certificación, cierra caso
```

---

### Paso 2B: Generación del Certificado Oficial (Art. 1002)

```
┌──────────────────────────────────────────────────────────────┐
│ FORMULARIO OFICIAL DE CERTIFICACIÓN DE HEMORRAGIA            │
│                                                               │
│ DATOS DEL CABALLO:                                           │
│ • Nombre: ________________________                            │
│ • Número de Identificación (Microchip): ___________           │
│ • Sexo: ☐ Macho ☐ Hembra ☐ Castrado                        │
│ • Dueño: ________________________                             │
│ • Entrenador: ________________________                        │
│                                                               │
│ HEMORRAGIA DETECTADA:                                        │
│ • Fecha de detección: __________________                     │
│ • Tipo: ☐ Epistaxis Unilateral ☐ Bilateral ☐ Traqueal      │
│ • Observado después de: ☐ Ejercicio ☐ Carrera              │
│ • Descripción: ________________________________              │
│                                                               │
│ DOSIS DE FUROSEMIDE RECETADA:                               │
│ • Dosis: __________ mg (100-500 mg)                          │
│ • Vía: IV (Intravenosa)                                      │
│                                                               │
│ FIRMAS:                                                      │
│                                                               │
│ Veterinario Oficial (AIDH):                                  │
│ Nombre: ______________________ Fecha: ___________            │
│ Firma: ______________________ Cédula: ___________            │
│                                                               │
│ Veterinario Autorizado (Privado):                           │
│ Nombre: ______________________ Fecha: ___________            │
│ Firma: ______________________ Cédula: ___________            │
│                                                               │
│ Testigo (Dueño/Entrenador/Representante):                   │
│ Nombre: ______________________ Fecha: ___________            │
│ Firma: ______________________ Cédula: ___________            │
└──────────────────────────────────────────────────────────────┘
```

**Documentos generados:**
- 📄 **CERTIFICADO OFICIAL de Hemorragia Pulmonar (firmado)**
- 📸 Anexos: Fotos/videos de evidencia clínica

---

## **FASE 3: DISTRIBUCIÓN Y REGISTRO (ART. 1002)**

```
┌──────────────────────────────────────────────────────────────┐
│ DISTRIBUCIÓN DE COPIAS DEL CERTIFICADO                       │
│                                                               │
│ Copia 1: → DUEÑO/ENTRENADOR/REPRESENTANTE                   │
│          📧 Email certificado PDF                            │
│          📋 Documento físico en mano                          │
│                                                               │
│ Copia 2: → SECRETARIO DE CARRERAS                           │
│          📧 Email certificado PDF                            │
│          📋 Archivo en expediente oficial                    │
│                                                               │
│ Copia 3: → OFICINA DEL ADMINISTRADOR HÍPICO                 │
│          📧 Email certificado PDF                            │
│          📋 Archivo en expediente oficial                    │
│                                                               │
│ Copia 4: → OFICINA DIRECTOR DE SERVICIOS VET                │
│          📋 Archivo permanente en LOES                       │
│          💾 Registrada en base de datos                      │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ BASE DE DATOS: CABALLO REGISTRADO EN LOES                    │
│                                                               │
│ Tabla: horses                                                │
│ ├─ en_loes: TRUE                                             │
│ ├─ loes_certificado_en: [FECHA DEL CERTIFICADO]             │
│ ├─ loes_furosemide_dosis: 200 (ej.)                          │
│ ├─ loes_episodios_hemorragia: 1 (contador)                   │
│ ├─ loes_suspension_hasta: NULL (si no hay suspensión)        │
│ └─ loes_certificado_url: /docs/cert_2026-07-06.pdf          │
│                                                               │
│ Status: ✅ PERMANENTE EN LOES (de por vida)                 │
└──────────────────────────────────────────────────────────────┘
```

**Estado en el sistema:**
- 🟢 Caballo marcado como LOES
- 📄 Certificado guardado
- 📧 Notificaciones enviadas
- 💾 Historial registrado

---

## **FASE 4: PRIMERA RESTRICCIÓN (ART. 1415)**

```
┌──────────────────────────────────────────────────────────────┐
│ CÁLCULO DE SUSPENSIÓN (Artículo 1415)                        │
│                                                               │
│ Este es el 1er episodio → SUSPENSIÓN: 15 DÍAS CALENDARIOS   │
│                                                               │
│ Sistema calcula:                                             │
│ • Fecha de sangrado: 2026-07-06                              │
│ • Fecha de fin de suspensión: 2026-07-21                     │
│ • Caballos puede participar nuevamente: 2026-07-22           │
│                                                               │
│ Base de datos se actualiza:                                  │
│ horses.loes_suspension_hasta = '2026-07-21'                  │
│                                                               │
│ Sistema BLOQUEA:                                             │
│ ✗ Inscripción en cualquier carrera hasta 2026-07-22          │
│ ✗ Aunque sea sin PMF                                         │
│                                                               │
│ Notificación enviada a:                                      │
│ 📧 Dueño: "Caballo suspendido hasta 2026-07-21"              │
│ 📧 Entrenador: "Caballo suspendido hasta 2026-07-21"         │
│ 📧 Administrador: "Nueva suspensión en LOES"                 │
└──────────────────────────────────────────────────────────────┘
```

---

## **FASE 5: SOLICITUD DE PMF EN CARRERA FUTURA (ART. 1101-1102)**

### Después de terminar la suspensión

```
┌──────────────────────────────────────────────────────────────┐
│ DUEÑO/ENTRENADOR INSCRIBE CABALLO EN CARRERA                 │
│                                                               │
│ Sistema detecta:                                             │
│ ✓ Caballo está en LOES                                       │
│ ✓ Suspensión ha terminado (si la había)                      │
│                                                               │
│ Pregunta al usuario:                                         │
│ ┌────────────────────────────────────────┐                  │
│ │ Este caballo está en LOES              │                  │
│ │                                        │                  │
│ │ ¿Participa en PROGRAMA DE FUROSEMIDE? │                  │
│ │                                        │                  │
│ │ ☐ SÍ, con PMF                         │                  │
│ │ ☐ NO, sin medicación                  │                  │
│ └────────────────────────────────────────┘                  │
│                                                               │
│ SI ELIGE "SÍ":                                               │
│ • Sistema marca inscripción con "L" (Furosemide)             │
│ • Programa Oficial mostrará "L" en nombre del caballo        │
│ • Se genera SOLICITUD FORMAL DE PMF                          │
└──────────────────────────────────────────────────────────────┘
```

---

## **FASE 6: DÍA DE CARRERA - ADMINISTRACIÓN DE FUROSEMIDE (ART. 1403-1412)**

### Timeline de Día de Carrera

```
EJEMPLO: Carrera programada a las 13:00 (1:00 PM)

────────────────────────────────────────────────────────────────

08:30 AM ← PLAZO MÁXIMO DE LLEGADA (4½ horas antes)
┌────────────────────────────────────────────────────────┐
│ DUEÑO/ENTRENADOR presenta caballo                      │
│ en ÁREA DE MUESTRAS / MEDICACIÓN                       │
│                                                         │
│ Docentes checklist:                                    │
│ ☑ Caballo identificado correctamente                   │
│ ☑ Documentación en orden                               │
│ ☑ Caballo en buen estado físico                        │
└────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────

12:00 PM ← PLAZO MÁXIMO DE ENTREGA DE RECETA (mediodía)
┌────────────────────────────────────────────────────────┐
│ DUEÑO/ENTRENADOR entrega RECETA VETERINARIA            │
│                                                         │
│ Receta debe incluir:                                   │
│ • Nombre del caballo                                   │
│ • Dosis de Furosemide (100-500 mg)                     │
│ • Firma del Vet Autorizado que receta                  │
│ • Fecha y hora                                         │
│                                                         │
│ VET OFICIAL DE TURNO recibe y verifica:               │
│ ✓ Dosis está en rango permitido                        │
│ ✓ Firma es válida                                      │
│ ✓ Formulario completo                                  │
└────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────

09:00 AM - 12:30 PM ← VENTANA DE ADMINISTRACIÓN (≥4 horas antes)
┌────────────────────────────────────────────────────────┐
│ VET OFICIAL ADMINISTRA FUROSEMIDE                       │
│                                                         │
│ Procedimiento (Art. 1410):                             │
│ 1. Verifica identidad del caballo NUEVAMENTE           │
│ 2. Prepara jeringuilla estéril desechable              │
│ 3. Administra dosis vía IV (ÚNICA VÍA PERMITIDA)       │
│ 4. Registra en formulario oficial:                     │
│    • Hora exacta de administración                     │
│    • Dosis administrada                                │
│    • Nombre y firma del Vet Oficial                    │
│    • Nombre y firma de TESTIGO (dueño/entrenador)      │
│                                                         │
│ CRITERIO: Administración ANTES de las 09:00 AM         │
│ (mínimo 4 horas antes de salida a las 13:00)           │
└────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────

13:00 PM ← HORA DE SALIDA DE CARRERA
┌────────────────────────────────────────────────────────┐
│ CABALLO PARTICIPA EN CARRERA                           │
│ (Con Furosemide en el sistema desde hace 4+ horas)     │
└────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────

DESPUÉS DE CARRERA:
┌────────────────────────────────────────────────────────┐
│ TOMA DE MUESTRAS (si caballo ganó o es seleccionado)   │
│                                                         │
│ Análisis busca:                                        │
│ • Furosemide en sangre: ≤ 100 ng/mL (plasma/suero)     │
│ • Gravedad específica de orina: ≥ 1.010                │
│                                                         │
│ Resultado esperado: NORMAL (conforme a Art. 1413)      │
└────────────────────────────────────────────────────────┘
```

---

## **FORMULARIO OFICIAL DE ADMINISTRACIÓN (Art. 1412)**

```
┌──────────────────────────────────────────────────────────────┐
│                 PMF - ADMINISTRACIÓN OFICIAL                 │
│           Programa de Medicación con Furosemide              │
│                                                               │
│ CARRERA: _________________ FECHA: ______________            │
│ HORA DE SALIDA PROGRAMADA: ______________                    │
│                                                               │
│ IDENTIFICACIÓN DEL EJEMPLAR:                                │
│ • Nombre: ________________________ (Art. 1412a)              │
│ • Número de Identificación: ________________                 │
│ • Microchip: ____________________________                     │
│ • Sexo: ☐ Macho ☐ Hembra ☐ Castrado                        │
│                                                               │
│ ADMINISTRACIÓN DE FUROSEMIDE:                               │
│ • Fecha: __________________ (Art. 1412b)                    │
│ • Hora EXACTA: __________________ (Art. 1412b)              │
│ • Dosis administrada: __________ mg (Art. 1412b)             │
│ • Vía: IV Intravenosa (ÚNICA PERMITIDA) (Art. 1408b)        │
│ • Aguja estéril desechable: ☐ Sí (Art. 1410)               │
│                                                               │
│ FIRMAS:                                                      │
│                                                               │
│ Veterinario Oficial (AIDH):                                  │
│ Nombre en LETRA DE IMPRENTA: _____________________           │
│ Firma: _____________________ Cédula: ____________            │
│ Hora de firma: _____________ (Art. 1412c)                   │
│                                                               │
│ TESTIGO (Dueño/Entrenador/Representante):                   │
│ Nombre en LETRA DE IMPRENTA: _____________________           │
│ Firma: _____________________ Cédula: ____________            │
│ Relación con caballo: ☐ Dueño ☐ Entrenador ☐ Representante │
│ Hora de firma: _____________ (Art. 1412c)                   │
│                                                               │
│ CERTIFICACIÓN:                                              │
│ Certificamos que la dosis de Furosemide fue administrada     │
│ correctamente, vía IV, en la dosis recetada, a la hora       │
│ especificada, en presencia del testigo arriba firmante.      │
│                                                               │
│ En fe de lo anterior, se firma este documento.               │
│                                                               │
│ OBSERVACIONES: _________________________________             │
│ _____________________________________________              │
│                                                               │
│ Este formulario se archiva en:                              │
│ • Expediente del caballo (AIDH)                              │
│ • Oficina Director de Servicios Veterinarios                │
│ • Copia a Secretaría de Carreras (antes de retiros)         │
│ • Copia a Dueño/Entrenador                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## **FASE 7: SI HAY NUEVO EPISODIO DE SANGRADO (ART. 1415)**

```
┌──────────────────────────────────────────────────────────────┐
│ DURANTE O DESPUÉS DE CARRERA: CABALLO SANGRA NUEVAMENTE      │
│                                                               │
│ Sistema actualiza:                                           │
│ ├─ loes_episodios_hemorragia: 2 (incrementa contador)        │
│ └─ loes_suspension_hasta: NOW() + 30 DÍAS (2do episodio)     │
│                                                               │
│ RESTRICCIONES APLICADAS:                                    │
│ • 2do episodio: 30 DÍAS de suspensión (vs 15 días primero)   │
│ • 3er episodio: 60 DÍAS                                      │
│ • 4to episodio: 90 DÍAS + EVALUACIÓN OFICIAL                │
│                                                               │
│ Notificaciones:                                              │
│ 📧 Dueño: "Nuevo episodio detectado - Suspensión 30 días"    │
│ 📧 Entrenador: "Nuevo episodio detectado - Suspensión 30 d"  │
│ 📧 Admin: "Nuevo episodio episodio #2 en LOES"               │
│                                                               │
│ Sistema BLOQUEA inscripciones nuevamente                     │
└──────────────────────────────────────────────────────────────┘
```

---

## **RESUMEN: ACTORES Y SUS RESPONSABILIDADES**

| Rol | Responsabilidad | Cuándo | Documentos |
|-----|-----------------|--------|-----------|
| **Vet Privado** | Detecta sangrado, examina, notifica | Inmediatamente post-ejercicio | Reporte clínico (no oficial) |
| **Vet Oficial** | Verifica, confirma, firma certificado | Dentro de 24h del reporte | Certificado oficial con firma |
| **Dueño/Entrenador** | Recibe notificación, acepta LOES | Post-certificación | Copia de certificado |
| **Secretario Carreras** | Recibe certificado, marca caballo | Post-certificación | Archivo en expediente |
| **Administrador** | Aprueba entrada a LOES | Post-certificación | Archivo permanente |
| **Dir. Servicios Vet** | Mantiene LOES actualizada | Permanente | Base de datos LOES |
| **Dueño/Entrenador (día carrera)** | Presenta caballo, entrega receta, actúa como testigo | 4½ hrs antes carrera | Solicitud PMF, Receta |
| **Vet Oficial (día carrera)** | Administra Furosemide, firma registro | 4 hrs antes carrera | Formulario de administración |

---

## **TABLA DE ESTADOS DEL CABALLO**

```
┌─────────────────────┬──────────────────────┬─────────────────────┐
│ ESTADO              │ ACCIONES PERMITIDAS  │ ACCIONES BLOQUEADAS  │
├─────────────────────┼──────────────────────┼─────────────────────┤
│ Caballo normal      │ ✓ Participar         │ • PMF               │
│ (no en LOES)        │   en carreras        │ • Furosemide        │
├─────────────────────┼──────────────────────┼─────────────────────┤
│ En LOES             │ ✓ Participar         │                     │
│ (sin suspensión)    │   con PMF            │                     │
│                     │ ✓ Participar         │                     │
│                     │   sin PMF            │                     │
├─────────────────────┼──────────────────────┼─────────────────────┤
│ En LOES             │ ✓ Entrenar           │ ✗ Participar en     │
│ + SUSPENSIÓN ACTIVA │ ✓ Prepararse         │   carreras (ningún  │
│ (15/30/60/90 días)  │                      │   tipo)             │
├─────────────────────┼──────────────────────┼─────────────────────┤
│ En LOES + 4to       │ • Evaluación Vet.    │ ✗ Participar hasta  │
│ episodio            │ • Decisión final     │   evaluación        │
│ (≥90 días)          │   del Oficial        │                     │
└─────────────────────┴──────────────────────┴─────────────────────┘
```

---

## **FLUJO EN TU APP: REQUISITOS TÉCNICOS**

```
BASE DE DATOS - Tabla horses:
├─ en_loes: BOOLEAN (true/false)
├─ loes_certificado_en: TIMESTAMP (fecha del certificado)
├─ loes_vet_oficial_id: UUID (quién certificó)
├─ loes_vet_privado_id: UUID (quién detectó)
├─ loes_furosemide_dosis: INTEGER (100-500 mg)
├─ loes_episodios_hemorragia: INTEGER (contador: 1, 2, 3, 4+)
├─ loes_suspension_hasta: DATE (NULL si no hay, o fecha)
├─ loes_certificado_url: VARCHAR (link a PDF)
└─ loes_historial_json: JSON (todas las acciones)

TABLA NUEVA: loes_certificates
├─ id: UUID
├─ horse_id: UUID (FK)
├─ fecha_certificacion: TIMESTAMP
├─ tipo_hemorragia: ENUM (epistaxis_uni, epistaxis_bi, traqueal)
├─ descripcion: TEXT
├─ vet_oficial_id: UUID (quien verifica/certifica)
├─ vet_privado_id: UUID (quien detecta)
├─ vet_oficial_firma_ts: TIMESTAMP
├─ vet_privado_firma_ts: TIMESTAMP
├─ dosis_recetada: INTEGER
├─ pdf_url: VARCHAR
├─ estado: ENUM (draft, signed, official, distributed)
└─ created_at, updated_at

TABLA NUEVA: pmf_administrations
├─ id: UUID
├─ pmf_record_id: UUID (FK)
├─ vet_oficial_id: UUID
├─ testigo_nombre: VARCHAR
├─ testigo_cedula: VARCHAR
├─ testigo_tipo: ENUM (dueno, entrenador, representante)
├─ hora_administracion: TIME
├─ dosis_administrada: INTEGER
├─ vet_oficial_firma_ts: TIMESTAMP
├─ testigo_firma_ts: TIMESTAMP
├─ firma_digital_vet: BLOB (imagen de firma)
├─ firma_digital_testigo: BLOB (imagen de firma)
├─ pdf_url: VARCHAR
└─ created_at
```

---

¿Quieres que comience a implementar esto? ¿Por dónde empezamos? 👍
