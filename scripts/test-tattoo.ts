import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { searchIncompassHorse } from '@/lib/incompass'

async function main() {
  const result = await searchIncompassHorse('981020055636933')

  console.log('\n📋 Test Abuela Tolin (981020055636933):')
  console.log('Found:', result.found)
  if (result.found && result.data) {
    console.log('Tattoo:', result.data.tattoo)
    console.log('Full data keys:', Object.keys(result.data))
  }
  console.log()
}

main()
