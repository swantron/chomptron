// Test suite for Chomptron AI Recipe Generator
console.log('Running Chomptron tests...\n');

const fs = require('fs');
const http = require('http');

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

// Static file tests
console.log('File Structure Tests:');
assert(fs.existsSync('./server.js'), 'server.js exists');
assert(fs.existsSync('./index.html'), 'index.html exists');
assert(fs.existsSync('./Dockerfile'), 'Dockerfile exists');
assert(fs.existsSync('./cloudbuild.yaml'), 'cloudbuild.yaml exists');

// Package dependencies test
console.log('\nDependency Tests:');
const pkg = require('./package.json');
assert(pkg.dependencies.express, 'express dependency exists');
assert(pkg.dependencies['@google/generative-ai'], 'Gemini AI dependency exists');
assert(pkg.name === 'chomptron', 'package name is chomptron');
assert(pkg.description.includes('recipe'), 'package description mentions recipes');

// Dockerfile validation
console.log('\nDocker Configuration Tests:');
const dockerfile = fs.readFileSync('./Dockerfile', 'utf8');
assert(dockerfile.includes('FROM node'), 'Dockerfile uses Node base image');
assert(dockerfile.includes('npm'), 'Dockerfile installs dependencies');
assert(dockerfile.includes('EXPOSE 8080'), 'Dockerfile exposes port 8080');

// Cloud Build configuration
console.log('\nCloud Build Tests:');
const cloudbuild = fs.readFileSync('./cloudbuild.yaml', 'utf8');
assert(cloudbuild.includes('docker'), 'cloudbuild.yaml has docker build step');
assert(cloudbuild.includes('push'), 'cloudbuild.yaml has docker push step');
assert(cloudbuild.includes('chomptron'), 'cloudbuild.yaml references chomptron');

// Server code validation
console.log('\nServer Code Tests:');
const serverCode = fs.readFileSync('./server.js', 'utf8');
assert(serverCode.includes('/api/generate-recipe'), 'server has recipe generation endpoint');
assert(serverCode.includes('/health'), 'server has health check endpoint');
assert(serverCode.includes('/ready'), 'server has readiness check endpoint');
assert(serverCode.includes('GoogleGenerativeAI'), 'server uses Gemini AI');

// HTML content validation
console.log('\nFrontend Tests:');
const html = fs.readFileSync('./index.html', 'utf8');
assert(html.includes('Chomptron'), 'HTML includes Chomptron branding');
assert(html.includes('recipe'), 'HTML mentions recipes');
assert(html.includes('/api/generate-recipe'), 'HTML calls recipe API');
assert(html.includes('ingredients'), 'HTML has ingredients input');

// Node.js version check
console.log('\nEnvironment Tests:');
const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
assert(nodeVersion >= 18, `Node.js version >= 18 (current: ${process.version})`);

// Health check endpoint test
console.log('\nHealth Check Tests:');
const server = require('./server.js');
const port = 8080;

setTimeout(() => {
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/health',
    method: 'GET'
  };

  const healthReq = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        assert(res.statusCode === 200, '/health endpoint returns 200');
        assert(json.status === 'healthy', '/health endpoint returns healthy status');
        assert(json.service === 'chomptron', '/health endpoint identifies as chomptron');
      } catch (e) {
        assert(false, '/health endpoint returns valid JSON');
      }
      
      // Test readiness endpoint
      const readyOptions = {...options, path: '/ready'};
      const readyReq = http.request(readyOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            assert([200, 503].includes(res.statusCode), '/ready endpoint returns 200 or 503');
            assert(json.status !== undefined, '/ready endpoint returns status');
          } catch (e) {
            assert(false, '/ready endpoint returns valid JSON');
          }
          
          // Summary
          console.log(`\n${'='.repeat(50)}`);
          console.log(`✓ ${passed} passed | ✗ ${failed} failed`);
          console.log(`${'='.repeat(50)}`);
          
          server.close();
          
          if (failed > 0) {
            process.exit(1);
          }
          console.log('\n✓ All Chomptron tests passed!');
        });
      });
      
      readyReq.on('error', (e) => {
        assert(false, '/ready endpoint is accessible');
        server.close();
        process.exit(1);
      });
      
      readyReq.end();
    });
  });

  healthReq.on('error', (e) => {
    assert(false, '/health endpoint is accessible');
    server.close();
    process.exit(1);
  });

  healthReq.end();
}, 1000);
