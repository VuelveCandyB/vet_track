import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function clearLOES() {
  const { data, error } = await supabase
    .from('horses')
    .update({
      en_loes: false,
      fecha_ingreso_loes: null,
    })
    .eq('en_loes', true)
    .select()

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`✓ Removed ${data?.length || 0} horses from LOES`)
}

clearLOES()
