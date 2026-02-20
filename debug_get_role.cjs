const { execSync } = require('child_process');

const userId = 'jx76hjjmqh3v8ttssg9298sdm1813eef'; // mundiandugi@gmail.com

console.log(`Running users:getRole for ${userId} in production...`);
try {
    const jsonArg = JSON.stringify({ userId: userId });
    const escapedJsonArg = jsonArg.replace(/"/g, '\\"');
    const command = `npx convex run --prod users:getRole "${escapedJsonArg}"`;
    console.log(`Running command: ${command}`);
    const result = execSync(command, { encoding: 'utf8' });
    console.log('Result:', result);
} catch (error) {
    console.error('Failed to run query:', error.stdout || error.stderr || error.message);
}
