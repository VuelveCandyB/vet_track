const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateRole() {
  const email = "hildamoros@hotmail.com";
  
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  
  if (!user) {
    console.log(`❌ Usuario no encontrado`);
    return;
  }
  
  // Eliminar rol official_vet
  const { error: deleteError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', user.id)
    .eq('role', 'official_vet');
  
  if (deleteError) {
    console.error(`❌ Error eliminando rol: ${deleteError.message}`);
    return;
  }
  
  // Agregar rol authorized_vet
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({
      user_id: user.id,
      role: 'authorized_vet'
    });
  
  if (insertError) {
    console.error(`❌ Error insertando rol: ${insertError.message}`);
    return;
  }
  
  console.log(`✅ ${email}`);
  console.log(`   Rol anterior: official_vet`);
  console.log(`   Nuevo rol: authorized_vet`);
}

updateRole().catch(err => console.error('Error:', err));
