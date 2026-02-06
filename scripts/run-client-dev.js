#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

let clientDir = path.join(__dirname, '..', 'client');

// Normalize Windows path to have uppercase drive letter
if (process.platform === 'win32' && clientDir[1] === ':') {
  clientDir = clientDir[0].toUpperCase() + clientDir.slice(1);
}

try {
  execSync('npm run dev', {
    cwd: clientDir,
    stdio: 'inherit',
    env: { ...process.env },
  });
} catch (error) {
  process.exit(error.status || 1);
}
