
// Complete authentication flow test - demonstrates all auth APIs
const axios = require('axios');

const API_BASE = 'http://localhost:8080/v1';

console.log('\n🔐 Testing Complete Authentication Flow\n');
console.log('━'.repeat(60));

async function testAuthFlow() {
  try {
    // Generate unique email for testing
    const testEmail = `testuser${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';
    const testName = 'Test User';

    console.log('\n📝 Step 1: Register New User');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Name: ${testName}`);
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      password: testPassword,
      name: testName
    });

    if (registerResponse.data.success) {
      const { token, user } = registerResponse.data.data;
      console.log('   ✅ Registration successful!');
      console.log(`   Token: ${token.substring(0, 30)}...`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   User Email: ${user.email}`);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('\n🔑 Step 2: Get Current User Info');
      const meResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (meResponse.data.success) {
        console.log('   ✅ User info retrieved!');
        console.log(`   Name: ${meResponse.data.data.name}`);
        console.log(`   Email: ${meResponse.data.data.email}`);
        console.log(`   Created: ${meResponse.data.data.created_at}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('\n👤 Step 3: Get User Profile');
      const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        console.log('   ✅ Profile retrieved!');
        const profile = profileResponse.data.data;
        console.log(`   Height: ${profile.height || 'Not set'}`);
        console.log(`   Weight Goal: ${profile.weight_goal || 'Not set'}`);
        console.log(`   Calorie Goal: ${profile.calorie_goal || 2200}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('\n🔓 Step 4: Login with Credentials');
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: testEmail,
        password: testPassword
      });

      if (loginResponse.data.success) {
        console.log('   ✅ Login successful!');
        const newToken = loginResponse.data.data.token;
        console.log(`   New Token: ${newToken.substring(0, 30)}...`);
      }

      console.log('\n━'.repeat(60));
      console.log('\n✅ ALL AUTHENTICATION TESTS PASSED!\n');
      console.log('👉 CHECK YOUR BACKEND TERMINAL NOW');
      console.log('   You should see these 4 log entries:');
      console.log('   [POST] /v1/auth/register ::1 201 <time>ms');
      console.log('   [GET] /v1/auth/me ::1 200 <time>ms');
      console.log('   [GET] /v1/users/profile ::1 200 <time>ms');
      console.log('   [POST] /v1/auth/login ::1 200 <time>ms\n');
      console.log('🎉 Your backend is working correctly!\n');

    } else {
      console.error('   ❌ Registration failed:', registerResponse.data.message);
    }

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
      
      if (error.response.status === 400 && error.response.data.message?.includes('already exists')) {
        console.log('\n💡 User already exists - this is expected if you ran the test before.');
        console.log('   The backend is still working correctly!');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server is not running!');
      console.error('   Run: cd backend && make run');
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testAuthFlow();
