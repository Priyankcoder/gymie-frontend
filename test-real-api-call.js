
// Test script that simulates what your frontend app does
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/v1';

console.log('\n🔍 Testing Real API Calls (Check Backend Terminal for Logs)\n');
console.log('━'.repeat(60));

async function testAPICalls() {
  console.log('\n📡 Making 5 test requests to backend...\n');
  
  const tests = [
    {
      name: 'Health Check',
      request: () => axios.get('http://localhost:8080/health')
    },
    {
      name: 'Login (invalid credentials)',
      request: () => axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      }).catch(err => err.response)
    },
    {
      name: 'Register (missing data)',
      request: () => axios.post(`${API_BASE_URL}/auth/register`, {
        email: 'test@example.com'
      }).catch(err => err.response)
    },
    {
      name: 'Get Workouts (unauthorized)',
      request: () => axios.get(`${API_BASE_URL}/workouts`).catch(err => err.response)
    },
    {
      name: 'Get Profile (unauthorized)',
      request: () => axios.get(`${API_BASE_URL}/users/profile`).catch(err => err.response)
    }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${i + 1}. ${test.name}...`);
    
    try {
      const response = await test.request();
      console.log(`   ✓ Response: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`   ✓ Request sent (check backend logs)`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n━'.repeat(60));
  console.log('\n✅ All test requests sent!');
  console.log('\n👉 CHECK YOUR BACKEND TERMINAL NOW');
  console.log('   You should see 5 log entries like:');
  console.log('   [GET] /health ::1 200 1.234ms');
  console.log('   [POST] /v1/auth/login ::1 401 12.5ms');
  console.log('   [POST] /v1/auth/register ::1 400 8.3ms');
  console.log('   [GET] /v1/workouts ::1 401 5.2ms');
  console.log('   [GET] /v1/users/profile ::1 401 4.1ms');
  console.log('\n   If you see these logs → Your connection is working! ✨\n');
}

testAPICalls().catch(error => {
  console.error('\n❌ Error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('\n⚠️  Backend is not running!');
    console.error('   Run: cd backend && make run\n');
  }
});
