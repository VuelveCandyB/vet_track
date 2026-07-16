const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === "jdeangel@equuspr.com");
  
  if (!user) {
    console.log(`❌ Usuario no encontrado`);
    return;
  }
  
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  
  console.log(`✅ jdeangel@equuspr.com`);
  console.log(`   Roles: ${roles.map(r => r.role).join(', ')}`);
}

check().catch(err => console.error('Error:', err));
