import { config } from 'dotenv'
import { importEuthanasiaRecords } from '@/lib/actions/euthanasia-import'

// Cargar env vars
config({ path: '.env.local' })

async function main() {
  console.log('📋 Importando registros de eutanasia (38 matches exactos)...\n')

  try {
    const result = await importEuthanasiaRecords()

    if (result.success) {
      console.log('✅ ÉXITO')
      console.log(`  • Matcheados: ${result.matched}`)
      console.log(`  • Actualizados: ${result.updated}`)
      console.log(`\n  Estos ${result.updated} caballos ahora tienen status='deceased'`)
    } else {
      console.log('❌ ERROR')
      result.errors.forEach(e => console.log(`  • ${e}`))
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
