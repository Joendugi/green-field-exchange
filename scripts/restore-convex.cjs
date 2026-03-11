const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring Convex mode...\n');

// Restore original files
const filesToRestore = [
  'package.json',
  'vite.config.ts', 
  'src/main.tsx',
  'src/App.tsx'
];

console.log('📦 Restoring original files...');
filesToRestore.forEach(file => {
  const backupPath = path.join(__dirname, '..', `${file}.convex-backup`);
  const originalPath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, originalPath);
    fs.unlinkSync(backupPath); // Remove backup
    console.log(`✓ Restored ${file}`);
  } else {
    console.log(`⚠️  No backup found for ${file}`);
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

console.log('\n🎉 Convex mode restored!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm run dev');
console.log('2. Test the application');
console.log('\n🔄 To switch back to Supabase-only mode, run: node scripts/run-supabase-only.cjs');
