
const axios = require('axios');

const API = 'http://localhost:8080/v1';

async function testWorkoutFlow() {
  try {
    // Generate unique email for testing
    const testEmail = `test${Date.now()}@example.com`;
    
    console.log('\n🔐 Testing Authenticated Workout Flow\n');
    console.log('=' .repeat(60));
    
    console.log('\n1️⃣  Registering new user...');
    console.log(`   Email: ${testEmail}`);
    const registerRes = await axios.post(`${API}/auth/register`, {
      email: testEmail,
      password: 'password123',
      name: 'Test User'
    });
    
    const token = registerRes.data.data.token;
    console.log('   ✅ Registration successful!');
    console.log(`   Token: ${token.substring(0, 30)}...`);
    
    console.log('\n2️⃣  Fetching workouts (with authentication)...');
    const workoutsRes = await axios.get(`${API}/workouts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Workouts retrieved!');
    console.log(`   Found ${workoutsRes.data.data?.length || 0} workouts`);
    
    console.log('\n3️⃣  Creating a new workout...');
    const today = new Date().toISOString(); // Use full ISO format
    const createRes = await axios.post(`${API}/workouts`, {
      date: today,
      name: 'Test Workout',
      duration: 60,
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { reps: 10, weight: 60, completed: true },
            { reps: 10, weight: 60, completed: true },
            { reps: 8, weight: 60, completed: true }
          ]
        },
        {
          name: 'Squat',
          sets: [
            { reps: 12, weight: 80, completed: true },
            { reps: 12, weight: 80, completed: true }
          ]
        }
      ],
      notes: 'Test workout from API',
      completed: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Workout created!');
    console.log(`   Workout ID: ${createRes.data.data?.id || 'N/A'}`);
    
    console.log('\n4️⃣  Fetching workouts again...');
    const workoutsRes2 = await axios.get(`${API}/workouts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Workouts retrieved!');
    console.log(`   Now have ${workoutsRes2.data.data?.length || 0} workouts`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('👉 Check your backend terminal for these log entries:');
    console.log('   [POST] /v1/auth/register ::1 201');
    console.log('   [GET] /v1/workouts ::1 200');
    console.log('   [POST] /v1/workouts ::1 201');
    console.log('   [GET] /v1/workouts ::1 200');
    console.log('\n🎉 Your backend authentication is working correctly!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.message || error.message);
    console.error('\nDetails:', error.response?.data || error.message);
    
    if (error.message.includes('Authorization header')) {
      console.log('\n💡 TIP: This error means the endpoint requires authentication.');
      console.log('   The token needs to be included in the Authorization header.');
      console.log('   In your app, make sure users login/register first!');
    }
  }
}

console.log('\n📝 This test demonstrates the complete authenticated workflow:');
console.log('   1. Register a user (no auth needed)');
console.log('   2. Use the returned token for all other requests');
console.log('   3. Create and fetch workouts (auth required)\n');

testWorkoutFlow();
