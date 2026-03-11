// Simple migration runner using individual SQL files
const fs = require('fs');
const path = require('path');

// Read Supabase connection details from .env
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', anonKey ? 'Set' : 'Not set');

// Create a simple SQL runner using fetch
async function runSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response.json();
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  
  // Get all migration files sorted by timestamp
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log('Found migration files:', migrationFiles);

  // For now, just show what would be applied
  console.log('\nMigration files to apply:');
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`- ${file} (${stats.size} bytes)`);
  }

  console.log('\nTo apply these migrations:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ktrisnezcdsedqrsiujr');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste each migration file content in order');
  console.log('4. Execute each migration file');
  
  console.log('\nMigration files in order:');
  migrationFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
}

applyMigrations().catch(console.error);
