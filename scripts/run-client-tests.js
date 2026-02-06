#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

let clientDir = path.join(__dirname, '..', 'client');

// Normalize Windows path to have uppercase drive letter
if (process.platform === 'win32' && clientDir[1] === ':') {
  clientDir = clientDir[0].toUpperCase() + clientDir.slice(1);
}

// Set INIT_CWD to help vitest resolve paths correctly
process.env.INIT_CWD = clientDir;

try {
  execSync('npm test', {
    cwd: clientDir,
    stdio: 'inherit',
    env: { ...process.env, INIT_CWD: clientDir },
  });
} catch (error) {
  process.exit(error.status || 1);
}
