
// Simple Node.js script to test backend connection from frontend perspective
const axios = require('axios');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/v1';

console.log('=== Testing Frontend to Backend Connection ===\n');
console.log(`API Base URL: ${API_BASE_URL}\n`);

async function testConnection() {
  try {
    // Test 1: Health check
    console.log('1. Testing /health endpoint...');
    const healthResponse = await axios.get('http://localhost:8080/health');
    console.log('✓ Health check successful:', healthResponse.data);
    console.log('');

    // Test 2: Login endpoint (should fail but prove connectivity)
    console.log('2. Testing /v1/auth/login endpoint...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'test123'
      });
    } catch (error) {
      if (error.response) {
        console.log('✓ Backend responded (login failed as expected):', error.response.data);
        console.log('✓ Status code:', error.response.status);
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 3: Check CORS headers
    console.log('3. Testing CORS headers...');
    const corsTest = await axios.get('http://localhost:8080/health', {
      headers: {
        'Origin': 'http://localhost:19006' // Typical Expo dev server port
      }
    });
    console.log('✓ CORS headers present:');
    console.log('  - Access-Control-Allow-Origin:', corsTest.headers['access-control-allow-origin']);
    console.log('  - Access-Control-Allow-Methods:', corsTest.headers['access-control-allow-methods']);
    console.log('');

    console.log('=== ✓ All tests passed! Backend is accessible from frontend ===\n');
    console.log('Your frontend should be able to connect to the backend.');
    console.log('Check your backend terminal for request logs.\n');

  } catch (error) {
    console.error('✗ Connection test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠ Backend server is not running or not accessible at', API_BASE_URL);
      console.error('Make sure you have run: cd backend && make run');
    }
  }
}

testConnection();
