const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRoles() {
  const email = "hildamoros@hotmail.com";
  
  // Obtener usuario
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  
  if (!user) {
    console.log(`❌ Usuario no encontrado: ${email}`);
    return;
  }
  
  console.log(`\n📋 Usuario: ${email}`);
  console.log(`ID: ${user.id}\n`);
  
  // Obtener roles
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return;
  }
  
  if (!roles || roles.length === 0) {
    console.log(`⚠️  Sin roles asignados`);
    return;
  }
  
  console.log(`✅ Roles asignados:`);
  roles.forEach(r => {
    console.log(`   - ${r.role}`);
  });
}

checkRoles().catch(err => console.error('Error:', err));
