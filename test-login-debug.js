
const axios = require('axios');

const API = 'http://localhost:8080/v1';

async function testLogin() {
  console.log('\n🔍 Testing Login API Connection\n');
  console.log('=' .repeat(60));
  
  try {
    console.log('\n1️⃣  Testing backend connectivity...');
    const healthCheck = await axios.get('http://localhost:8080/health', { timeout: 5000 });
    console.log('   ✅ Backend is running!');
    console.log('   Status:', healthCheck.status);
    
    console.log('\n2️⃣  Testing login endpoint...');
    console.log('   URL:', `${API}/auth/login`);
    console.log('   Method: POST');
    console.log('   Data: { email: "test@example.com", password: "password123" }');
    
    const loginResponse = await axios.post(`${API}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('   ✅ Login endpoint responded!');
    console.log('   Status:', loginResponse.status);
    console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error occurred!');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔴 Backend server is NOT running!');
      console.error('   Please start the backend:');
      console.error('   cd backend && make run\n');
    } else if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n💡 This means:');
        console.log('   - Backend is running ✅');
        console.log('   - Login endpoint is working ✅');
        console.log('   - User credentials are invalid (expected for test user)');
        console.log('\n   Try registering first or use existing credentials.');
      }
    } else {
      console.error('   Message:', error.message);
    }
  }
}

testLogin();
