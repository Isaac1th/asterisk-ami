#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
let serverDir = path.join(rootDir, 'server');
let clientDir = path.join(rootDir, 'client');

// Normalize Windows paths to have uppercase drive letter
if (process.platform === 'win32') {
  if (serverDir[1] === ':') {
    serverDir = serverDir[0].toUpperCase() + serverDir.slice(1);
  }
  if (clientDir[1] === ':') {
    clientDir = clientDir[0].toUpperCase() + clientDir.slice(1);
  }
}

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('Starting server and client...\n');
console.log('Server dir:', serverDir);
console.log('Client dir:', clientDir);
console.log('');

// Start server - use shell:false to avoid WSL
const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: false,
  windowsHide: false,
});

// Start client - use shell:false to avoid WSL
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: false,
  windowsHide: false,
});

// Handle process exit
process.on('SIGINT', () => {
  server.kill();
  client.kill();
  process.exit();
});

server.on('error', (err) => {
  console.error('Server spawn error:', err);
});

client.on('error', (err) => {
  console.error('Client spawn error:', err);
});

server.on('exit', (code) => {
  if (code !== 0) console.log(`Server exited with code ${code}`);
});

client.on('exit', (code) => {
  if (code !== 0) console.log(`Client exited with code ${code}`);
});
