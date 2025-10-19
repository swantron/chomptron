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

// Test 4: Validate app.yaml exists
assert(fs.existsSync('./app.yaml'), 'app.yaml exists');

// Test 5: Check environment variable requirement
const appYaml = fs.readFileSync('./app.yaml', 'utf8');
assert(appYaml.includes('GEMINI_API_KEY'), 'app.yaml includes GEMINI_API_KEY');

// Test 6: Validate Node.js version
const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
assert(nodeVersion >= 18, `Node.js version >= 18 (current: ${process.version})`);

// Summary
console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✓ All tests passed!');
