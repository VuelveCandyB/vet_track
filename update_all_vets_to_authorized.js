const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const emails = [
  "ficoarbona@gmail.com",
  "randiarmand@yahoo.com",
  "victorbozzo.dvm@gmail.com",
  "gbritodvm@yahoo.com",
  "renecardonadvm@msn.com",
  "jcollazodvm@gmail.com",
  "jdeangel@equuspr.com",
  "equinepractitioners@yahoo.com",
  "ricardoloinaz@gmail.com",
  "nicolmgon@gmail.com",
  "mbrvet2008@gmail.com"
];

async function updateRoles() {
  console.log(`🔄 Cambiando ${emails.length} veterinarios de official_vet a authorized_vet...\n`);
  
  const { data: users } = await supabase.auth.admin.listUsers();
  
  let updated = 0;
  
  for (const email of emails) {
    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.log(`⚠️  No encontrado: ${email}`);
      continue;
    }
    
    // Eliminar official_vet
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id)
      .eq('role', 'official_vet');
    
    if (deleteError) {
      console.error(`❌ Error deletando rol: ${email} - ${deleteError.message}`);
      continue;
    }
    
    // Agregar authorized_vet
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'authorized_vet'
      });
    
    if (insertError) {
      console.error(`❌ Error insertando rol: ${email} - ${insertError.message}`);
      continue;
    }
    
    console.log(`✅ ${email}`);
    updated++;
  }
  
  console.log(`\n✅ Total actualizado: ${updated} de ${emails.length}`);
}

updateRoles().catch(err => console.error('Error:', err));
