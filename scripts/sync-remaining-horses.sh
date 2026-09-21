#!/bin/bash
# Force recompilation and sync remaining horses

cd "$(dirname "$0")/.."

echo "🔄 Limpiando caché de npx y ejecutando sync con código actualizado..."
echo ""

# Remove npx cache to force recompilation
rm -rf ~/.npm/_npx 2>/dev/null || true

# Run with explicit limit to ensure all horses are processed
echo "Ejecutando sync con limit(2000) para obtener TODOS los caballos..."
npx tsx --no-warnings scripts/full-incompass-sync.ts

echo ""
echo "✅ Sync completado. Generando reporte final..."
npx tsx scripts/final-sync-report.ts

echo ""
echo "🐴 Mostrando caballo con marcas corporales..."
npx tsx scripts/show-horse-with-markings.ts
