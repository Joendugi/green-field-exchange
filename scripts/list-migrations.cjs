const fs = require('fs');
const path = require('path');

async function listMigrations() {
  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  
  // Get all migration files sorted by timestamp
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log('Migration files to apply in order:');
  console.log('=====================================');
  
  migrationFiles.forEach((file, index) => {
    const filePath = path.join(migrationsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`${index + 1}. ${file} (${stats.size} bytes)`);
  });

  console.log('\nTo apply these migrations:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ktrisnezcdsedqrsiujr');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste each migration file content in order');
  console.log('4. Execute each migration file');
  
  console.log('\nFirst migration to apply:');
  if (migrationFiles.length > 0) {
    const firstFile = migrationFiles[0];
    console.log(`\nFile: ${firstFile}`);
    const filePath = path.join(migrationsDir, firstFile);
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('Content preview (first 500 chars):');
    console.log(content.substring(0, 500) + '...');
  }
}

listMigrations().catch(console.error);
