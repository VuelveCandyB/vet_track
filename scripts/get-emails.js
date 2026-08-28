#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse env variables
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ No se encontraron credenciales de Supabase en .env.local');
  process.exit(1);
}

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

async function getEmails() {
  // Use service role key for admin access to auth.users
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  try {
    // Get all users (admin access)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error consultando usuarios:', error);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('❌ No se encontraron usuarios');
      process.exit(1);
    }

    // Extract emails and sort
    const emails = users
      .map(u => u.email)
      .filter(e => e)
      .sort();

    console.log('\n📧 USUARIOS REGISTRADOS:');
    console.log('════════════════════════════════════════\n');

    emails.forEach((email, i) => {
      console.log(`${i + 1}. ${email}`);
    });

    console.log('\n════════════════════════════════════════');
    console.log(`\n📊 Total: ${emails.length} usuarios\n`);

    // Format for Outlook (comma-separated)
    const outlookFormat = emails.join(', ');
    console.log('📋 FORMATO OUTLOOK (copiar para pegar en "Para:"):\n');
    console.log(outlookFormat);
    console.log('\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

getEmails();
