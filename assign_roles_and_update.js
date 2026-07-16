// Script para asignar roles y actualizar información de De Angel
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Emails de veterinarios creados
const emails = [
  "hildamoros@hotmail.com",
  "ficoarbona@gmail.com",
  "randiarmand@yahoo.com",
  "victorbozzo.dvm@gmail.com",
  "gbritodvm@yahoo.com",
  "renecardonadvm@msn.com",
  "jcollazodvm@gmail.com",
  "equinepractitioners@yahoo.com",
  "ricardoloinaz@gmail.com",
  "nicolmgon@gmail.com",
  "mbrvet2008@gmail.com"
];

// De Angel que ya existe
const deAngelData = {
  email: "jdeangel@equuspr.com",
  licencia: "21-051",
  renovacion: "2028-03-05",
  tel1: "(787) 502-2712"
};

async function assignRolesAndUpdate() {
  console.log('📋 Asignando roles official_vet...\n');

  // Obtener todos los usuarios
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error('❌ Error obteniendo usuarios:', usersError.message);
    return;
  }

  let rolesAssigned = 0;

  // Asignar roles a todos los emails
  for (const email of emails) {
    const user = users.users.find(u => u.email === email);
    if (!user) continue;

    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'official_vet'
      }, { onConflict: 'user_id,role' });

    if (!error) {
      console.log(`✅ Rol asignado: ${email}`);
      rolesAssigned++;
    } else {
      console.error(`❌ Error asignando rol a ${email}: ${error.message}`);
    }
  }

  // Actualizar información de De Angel
  console.log('\n📝 Actualizando información de De Angel...');

  const deAngelUser = users.users.find(u => u.email === deAngelData.email);
  if (deAngelUser) {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: deAngelUser.id,
        license_number: deAngelData.licencia,
        license_renewal_date: deAngelData.renovacion,
        phone1: deAngelData.tel1
      }, { onConflict: 'id' });

    if (!error) {
      console.log(`✅ Información actualizada: ${deAngelData.email}`);
    } else {
      console.error(`❌ Error actualizando: ${error.message}`);
    }

    // Asignar rol también a De Angel
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: deAngelUser.id,
        role: 'official_vet'
      }, { onConflict: 'user_id,role' });

    if (!roleError) {
      console.log(`✅ Rol asignado a De Angel`);
      rolesAssigned++;
    }
  }

  console.log(`\n✅ Total de roles asignados: ${rolesAssigned} de 12`);
}

assignRolesAndUpdate().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
