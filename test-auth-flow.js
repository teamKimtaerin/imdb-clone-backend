const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';

// Test with existing user
const TEST_USER = {
    email: 'finaltest@example.com',
    password: 'Test123!@#'
};

async function testAuthFlow() {
    console.log('🧪 Testing Authentication Flow for Frontend');
    console.log('==========================================\n');
    
    try {
        // 1. Test Login
        console.log('1️⃣  LOGIN TEST');
        console.log('───────────────');
        console.log('Credentials:', TEST_USER);
        
        const loginResponse = await axios.post(`${API_URL}/login`, TEST_USER, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n✅ Login Response:');
        console.log('Status:', loginResponse.status);
        console.log('Data Structure:');
        console.log(JSON.stringify(loginResponse.data, null, 2));
        
        const { accessToken, refreshToken, user } = loginResponse.data.data;
        
        console.log('\n📋 Frontend Requirements Check:');
        console.log('  ✓ success:', loginResponse.data.success === true);
        console.log('  ✓ data.accessToken:', !!accessToken);
        console.log('  ✓ data.refreshToken:', !!refreshToken);
        console.log('  ✓ data.user.id:', !!user.id);
        console.log('  ✓ data.user.email:', user.email);
        console.log('  ✓ data.user.username:', user.username);
        console.log('  ✓ data.user.nickname:', user.nickname);
        console.log('  ✓ data.user.isEmailVerified:', user.isEmailVerified);
        
        // 2. Test Profile Endpoint (for NavigationBar user check)
        console.log('\n2️⃣  PROFILE TEST (for NavigationBar)');
        console.log('────────────────────────────────────');
        console.log('Using token:', accessToken.substring(0, 50) + '...');
        
        const profileResponse = await axios.get(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n✅ Profile Response:');
        console.log('Status:', profileResponse.status);
        console.log('Data:');
        console.log(JSON.stringify(profileResponse.data, null, 2));
        
        console.log('\n📋 NavigationBar Requirements:');
        console.log('  ✓ User object available:', !!profileResponse.data.data.user);
        console.log('  ✓ Can show "마이페이지" button:', !!profileResponse.data.data.user);
        console.log('  ✓ Can show "로그아웃" button:', !!profileResponse.data.data.user);
        
        // 3. Test Token in Different Formats
        console.log('\n3️⃣  TOKEN FORMAT TEST');
        console.log('─────────────────────');
        
        // Test with Bearer prefix
        try {
            const test1 = await axios.get(`${API_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            console.log('  ✓ Bearer token format: OK');
        } catch (e) {
            console.log('  ✗ Bearer token format: FAILED');
        }
        
        // 4. Test Refresh Token
        console.log('\n4️⃣  REFRESH TOKEN TEST');
        console.log('──────────────────────');
        
        const refreshResponse = await axios.post(`${API_URL}/refresh`, {
            refreshToken: refreshToken
        });
        
        console.log('  ✓ Token refresh successful');
        console.log('  New access token:', !!refreshResponse.data.data.accessToken);
        console.log('  New refresh token:', !!refreshResponse.data.data.refreshToken);
        
        // 5. Test with new token
        const newAccessToken = refreshResponse.data.data.accessToken;
        
        const profileWithNewToken = await axios.get(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${newAccessToken}`
            }
        });
        
        console.log('  ✓ New token works for profile endpoint');
        
        // Summary
        console.log('\n✅ AUTHENTICATION FLOW COMPLETE');
        console.log('════════════════════════════════');
        console.log('All requirements for NavigationBar met:');
        console.log('  1. Login returns user object with all fields');
        console.log('  2. Access token works with Bearer format');
        console.log('  3. Profile endpoint returns user data');
        console.log('  4. Token refresh works properly');
        console.log('\n👉 The NavigationBar should show:');
        console.log('  - "마이페이지" button when user is logged in');
        console.log('  - "로그아웃" button when user is logged in');
        console.log('  - "회원가입/로그인" button when user is not logged in');
        
        console.log('\n💡 Frontend AuthContext should:');
        console.log('  1. Store accessToken in localStorage/memory');
        console.log('  2. Store user object in context state');
        console.log('  3. Include Authorization header in API calls');
        console.log('  4. Handle token refresh when needed');
        
    } catch (error) {
        console.error('\n❌ Test Failed!');
        console.error('─────────────');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
            console.error('URL:', error.config.url);
            console.error('Headers:', error.config.headers);
        } else {
            console.error('Error:', error.message);
        }
        
        console.error('\n🔧 Troubleshooting:');
        console.error('  1. Check if server is running on port 4000');
        console.error('  2. Check if user exists (email: finaltest@example.com)');
        console.error('  3. Check CORS settings for localhost:3000');
        console.error('  4. Check if Authorization header is being sent');
    }
}

// Run the test
console.log('Testing backend compatibility with NavigationBar component...\n');
testAuthFlow();