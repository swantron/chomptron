// Simple test suite
console.log('Running tests...\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.log(`✗ ${message}`);
    failed++;
  }
}

// Test 1: Check if server.js exists
const fs = require('fs');
assert(fs.existsSync('./server.js'), 'server.js exists');

// Test 2: Check if index.html exists
assert(fs.existsSync('./index.html'), 'index.html exists');

// Test 3: Check if package.json has required dependencies
const pkg = require('./package.json');
assert(pkg.dependencies.express, 'express dependency exists');
assert(pkg.dependencies['@google/generative-ai'], '@google/generative-ai dependency exists');

// Test 4: Validate Dockerfile exists
assert(fs.existsSync('./Dockerfile'), 'Dockerfile exists');

// Test 5: Check Dockerfile has required content
const dockerfile = fs.readFileSync('./Dockerfile', 'utf8');
assert(dockerfile.includes('FROM node'), 'Dockerfile uses Node base image');
assert(dockerfile.includes('npm'), 'Dockerfile installs dependencies');

// Test 6: Validate cloudbuild.yaml exists
assert(fs.existsSync('./cloudbuild.yaml'), 'cloudbuild.yaml exists');

// Test 7: Check cloudbuild.yaml has required steps
const cloudbuild = fs.readFileSync('./cloudbuild.yaml', 'utf8');
assert(cloudbuild.includes('docker'), 'cloudbuild.yaml has docker build step');
assert(cloudbuild.includes('run'), 'cloudbuild.yaml has Cloud Run deploy step');

// Test 8: Validate Node.js version
const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
assert(nodeVersion >= 18, `Node.js version >= 18 (current: ${process.version})`);

// Summary
console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✓ All tests passed!');
