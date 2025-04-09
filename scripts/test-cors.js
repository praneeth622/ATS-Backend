// Script to test CORS configuration
const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:5001/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function testCORS() {
  console.log('Testing CORS configuration...');
  console.log(`API URL: ${API_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  
  // Test health endpoint with OPTIONS preflight
  try {
    console.log('\nTesting health endpoint with OPTIONS preflight...');
    const response = await fetch(`${API_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Check for CORS headers
    const allowOrigin = response.headers.get('access-control-allow-origin');
    const allowMethods = response.headers.get('access-control-allow-methods');
    const allowHeaders = response.headers.get('access-control-allow-headers');
    
    if (allowOrigin && allowMethods && allowHeaders) {
      console.log('✓ Preflight CORS headers are present!');
    } else {
      console.log('✗ Missing CORS headers in preflight response!');
    }
  } catch (error) {
    console.error('Error testing preflight:', error);
  }
  
  // Test actual health endpoint
  try {
    console.log('\nTesting actual health endpoint GET request...');
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Check for CORS headers
    const allowOrigin = response.headers.get('access-control-allow-origin');
    
    if (allowOrigin) {
      console.log('✓ CORS headers are present in GET response!');
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      console.log('✗ Missing CORS headers in GET response!');
    }
  } catch (error) {
    console.error('Error testing GET request:', error);
  }
  
  // Test auth/create-from-auth endpoint
  try {
    console.log('\nTesting auth/create-from-auth endpoint...');
    const response = await fetch(`${API_URL}/auth/create-from-auth`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Check for CORS headers
    const allowOrigin = response.headers.get('access-control-allow-origin');
    const allowMethods = response.headers.get('access-control-allow-methods');
    const allowHeaders = response.headers.get('access-control-allow-headers');
    
    if (allowOrigin && allowMethods && allowHeaders) {
      console.log('✓ CORS headers are present for auth/create-from-auth!');
    } else {
      console.log('✗ Missing CORS headers for auth/create-from-auth!');
    }
  } catch (error) {
    console.error('Error testing auth/create-from-auth:', error);
  }
}

testCORS().catch(console.error); 