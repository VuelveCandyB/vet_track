// Script para crear veterinarios con contraseñas cortas
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Generar contraseña corta (8 caracteres)
function generatePassword() {
  return crypto.randomBytes(4).toString('hex');
}

async function updatePasswords() {
  console.log(`🔄 Generando nuevas contraseñas cortas para ${veterinarios.length} veterinarios...\n`);

  const results = [];

  // Obtener usuarios existentes
  const { data: users } = await supabase.auth.admin.listUsers();

  for (const vet of veterinarios) {
    const user = users.users.find(u => u.email === vet.email);
    if (!user) continue;

    const newPassword = generatePassword();

    // Actualizar contraseña
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (!error) {
      results.push({
        nombre: `${vet.apellido}, ${vet.nombre}`,
        email: vet.email,
        password: newPassword,
        licencia: vet.licencia,
        renovacion: vet.renovacion,
        tel1: vet.tel1,
        tel2: vet.tel2
      });
      console.log(`✅ ${vet.email} - Nueva password: ${newPassword}`);
    } else {
      console.error(`❌ Error actualizando ${vet.email}: ${error.message}`);
    }
  }

  // Guardar CSV
  const csv = ['NOMBRE,EMAIL,PASSWORD,LICENCIA,RENOVACION,TEL1,TEL2'];
  results.forEach(r => {
    csv.push(`"${r.nombre}","${r.email}","${r.password}","${r.licencia}","${r.renovacion}","${r.tel1}","${r.tel2}"`);
  });

  const fs = require('fs');
  fs.writeFileSync('veterinarios_credenciales_final.csv', csv.join('\n'));

  console.log(`\n✅ CSV guardado: veterinarios_credenciales_final.csv`);
  console.log(`Total actualizado: ${results.length}`);
}

updatePasswords().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
