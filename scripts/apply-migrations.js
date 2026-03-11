const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to .env

if (!supabaseUrl || !serviceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!serviceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  
  // Get all migration files sorted by timestamp
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log('Found migrations:', migrationFiles);

  for (const file of migrationFiles) {
    console.log(`\nApplying migration: ${file}`);
    
    try {
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split SQL by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
            console.error('Error:', error);
            throw error;
          }
        }
      }
      
      console.log(`✓ Successfully applied ${file}`);
    } catch (error) {
      console.error(`✗ Failed to apply ${file}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations applied successfully!');
}

applyMigrations().catch(console.error);
