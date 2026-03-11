const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase-only mode...\n');

// Backup original files
const filesToBackup = [
  'package.json',
  'vite.config.ts', 
  'src/main.tsx',
  'src/App.tsx'
];

console.log('📦 Backing up original files...');
filesToBackup.forEach(file => {
  const originalPath = path.join(__dirname, '..', file);
  const backupPath = path.join(__dirname, '..', `${file}.convex-backup`);
  
  if (fs.existsSync(originalPath)) {
    fs.copyFileSync(originalPath, backupPath);
    console.log(`✓ Backed up ${file}`);
  }
});

// Copy Supabase-only versions
console.log('\n🔄 Switching to Supabase-only mode...');
const supabaseFiles = [
  { from: 'package-supabase-only.json', to: 'package.json' },
  { from: 'vite.config-supabase-only.ts', to: 'vite.config.ts' },
  { from: 'src/main-supabase-only.tsx', to: 'src/main.tsx' },
  { from: 'src/App-supabase-only.tsx', to: 'src/App.tsx' }
];

supabaseFiles.forEach(({ from, to }) => {
  const fromPath = path.join(__dirname, '..', from);
  const toPath = path.join(__dirname, '..', to);
  
  if (fs.existsSync(fromPath)) {
    fs.copyFileSync(fromPath, toPath);
    console.log(`✓ Switched ${to} to Supabase-only version`);
  }
});

console.log('\n🔧 Installing dependencies...');
const { execSync } = require('child_process');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✓ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('\n🎉 Supabase-only mode setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Apply database migrations in Supabase dashboard');
console.log('2. Run: npm run dev');
console.log('3. Test the application');
console.log('\n🔄 To switch back to Convex mode, run: node scripts/restore-convex.cjs');
