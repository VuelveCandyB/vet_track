import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data } = await supabase
    .from('horses')
    .select('id, name, microchip, registration, raza, madre, tattoo')
    .eq('name', 'Grand Joker')
    .limit(1)

  console.log('\n📊 Grand Joker:')
  console.log(JSON.stringify(data, null, 2))
  console.log()
}

main()
