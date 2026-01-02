#!/usr/bin/env node

/**
 * Test script to verify Android Emulator can connect to backend
 * Run: node test-android-emulator-connection.js
 */

const axios = require('axios');

const API_URL = 'http://10.0.2.2:8080/v1';

async function testConnection() {
  console.log('🔍 Testing Android Emulator connection to backend...\n');
  console.log(`Target URL: ${API_URL}\n`);

  // Test 1: Health check
  try {
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`, {
      timeout: 5000,
    });
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Register endpoint (should fail with validation but proves connectivity)
  try {
    console.log('\n2️⃣ Testing auth/register endpoint...');
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User',
    });
    console.log('✅ Register endpoint responded:', response.status);
  } catch (error) {
    if (error.response) {
      console.log('✅ Register endpoint reachable (validation error is expected):', error.response.status);
    } else {
      console.log('❌ Register endpoint failed:', error.message);
    }
  }

  // Test 3: Direct host connection
  try {
    console.log('\n3️⃣ Testing direct connection to localhost:8080...');
    const directResponse = await axios.get('http://localhost:8080/v1/health', {
      timeout: 5000,
    });
    console.log('✅ Direct localhost connection works:', directResponse.data);
  } catch (error) {
    console.log('ℹ️ Direct localhost connection (this is expected from host machine)');
  }

  console.log('\n✨ Connection test completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Stop the Metro bundler (Ctrl+C in the terminal running npm start)');
  console.log('2. Clear Metro cache: npx expo start -c');
  console.log('3. Rebuild the app on Android emulator');
  console.log('4. Try logging in again');
}

testConnection().catch(console.error);
