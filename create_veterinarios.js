// Script para crear veterinarios en Supabase
// Ejecutar: node create_veterinarios.js

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos de veterinarios
const veterinarios = [
  { nombre: "AMOROS MEJIAS", apellido: "HILDA", licencia: "21-050", renovacion: "2026-12-28", tel1: "(787) 420-5589", tel2: "", email: "hildamoros@hotmail.com" },
  { nombre: "ARBONA ORTIZ", apellido: "FEDERICO", licencia: "19-812", renovacion: "2027-09-01", tel1: "(787) 368-5177", tel2: "", email: "ficoarbona@gmail.com" },
  { nombre: "ARMAND CUBILLO", apellido: "RANDI", licencia: "20-239", renovacion: "2028-08-27", tel1: "(504) 261-4897", tel2: "", email: "randiarmand@yahoo.com" },
  { nombre: "BOZZO BONILLA", apellido: "VICTOR L.", licencia: "19-277", renovacion: "2027-06-16", tel1: "(787) 368-5173", tel2: "(787) 460-3997", email: "victorbozzo.dvm@gmail.com" },
  { nombre: "BRITO BRU", apellido: "GUSTAVO", licencia: "21-145", renovacion: "2027-05-22", tel1: "(787) 312-3999", tel2: "(787) 850-7380", email: "gbritodvm@yahoo.com" },
  { nombre: "CARDONA DURAN", apellido: "IVAN RENE", licencia: "20-647", renovacion: "2026-09-09", tel1: "(787) 368-5172", tel2: "(787) 368-5183", email: "renecardonadvm@msn.com" },
  { nombre: "COLLAZO PEÑA", apellido: "JUAN", licencia: "19-506", renovacion: "2026-11-26", tel1: "(787) 368-5176", tel2: "", email: "jcollazodvm@gmail.com" },
  { nombre: "DE ANGEL RAMIREZ", apellido: "JOSE", licencia: "21-051", renovacion: "2028-03-05", tel1: "(787) 502-2712", tel2: "", email: "jdeangel@equuspr.com" },
  { nombre: "GARCIA BLANCO", apellido: "JOSE M.", licencia: "20-922", renovacion: "2027-01-09", tel1: "(787) 236-1191", tel2: "(787) 886-1030", email: "equinepractitioners@yahoo.com" },
  { nombre: "LOINAZ RIVERA", apellido: "RICARDO J.", licencia: "19-508", renovacion: "2030-01-07", tel1: "(787) 428-2884", tel2: "", email: "ricardoloinaz@gmail.com" },
  { nombre: "MEDINA GONZALEZ", apellido: "NICOL", licencia: "21-205", renovacion: "2027-12-16", tel1: "(939) 579-4463", tel2: "", email: "nicolmgon@gmail.com" },
  { nombre: "ROMAN VALLDEJULI", apellido: "MARTA B", licencia: "21-173", renovacion: "2026-07-26", tel1: "(787) 234-8799", tel2: "(787) 612-6895", email: "mbrvet2008@gmail.com" }
];

function generatePassword() {
  return crypto.randomBytes(8).toString('hex');
}

async function createVeterinarios() {
  console.log(`📋 Creando ${veterinarios.length} veterinarios...\n`);

  const results = [];
  let created = 0;
  let errors = 0;

  for (const vet of veterinarios) {
    try {
      const password = generatePassword();
      const displayName = `${vet.apellido}, ${vet.nombre}`;

      // Crear usuario en Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: vet.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: vet.nombre,
          last_name: vet.apellido,
        }
      });

      if (error) {
        console.error(`❌ Error creando ${displayName}: ${error.message}`);
        errors++;
        continue;
      }

      const userId = data.user.id;

      // Insertar en profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: vet.nombre,
          last_name: vet.apellido,
          license_number: vet.licencia,
          license_renewal_date: vet.renovacion,
          phone1: vet.tel1 || null,
          phone2: vet.tel2 || null,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error(`❌ Error insertando profile para ${displayName}: ${profileError.message}`);
        errors++;
        continue;
      }

      // Asignar rol official_vet
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'official_vet',
          granted_by: 'admin_script'
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error(`⚠️  Error asignando rol para ${displayName}: ${roleError.message}`);
      }

      results.push({
        nombre: displayName,
        email: vet.email,
        password: password,
        licencia: vet.licencia,
        renovacion: vet.renovacion,
        tel1: vet.tel1,
        tel2: vet.tel2
      });

      console.log(`✅ ${displayName} - ${vet.email}`);
      created++;

    } catch (err) {
      console.error(`❌ Error inesperado para ${vet.apellido}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n\n✅ Creados: ${created}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`\n📥 Guardando CSV con credenciales...\n`);

  // Guardar CSV
  const csv = ['NOMBRE,EMAIL,PASSWORD,LICENCIA,RENOVACION,TEL1,TEL2'];
  results.forEach(r => {
    csv.push(`"${r.nombre}","${r.email}","${r.password}","${r.licencia}","${r.renovacion}","${r.tel1}","${r.tel2}"`);
  });

  const fs = require('fs');
  fs.writeFileSync('veterinarios_creados.csv', csv.join('\n'));

  console.log('✅ CSV guardado: veterinarios_creados.csv');
  console.log('\n⚠️  IMPORTANTE: Guarda este archivo CSV en un lugar seguro.');
  console.log('   Contiene las contraseñas temporales de los veterinarios.');
}

createVeterinarios().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
