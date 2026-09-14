#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupReferidos() {
  try {
    console.log('🔍 Checking buckets...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) throw listError

    console.log(`✓ Found ${buckets.length} buckets`)

    const referidosBucket = buckets.find(b => b.name === 'referidos')
    if (referidosBucket) {
      console.log('✓ Bucket "referidos" already exists')
    } else {
      console.log('📦 Creating "referidos" bucket...')
      const { data, error } = await supabase.storage.createBucket('referidos', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      })
      if (error) throw error
      console.log('✓ Bucket "referidos" created successfully')
    }

    console.log('\n✅ Setup complete!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

setupReferidos()
