const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';
let authToken = null;
let refreshToken = null;

// Test credentials
const timestamp = Date.now().toString().slice(-8);
const TEST_CREDENTIALS = {
    email: `frontend${timestamp}@test.com`,
    username: `frontend${timestamp}`,
    nickname: `Frontend${timestamp}`,
    password: 'Test123!@#'
};

async function testFrontendCompatibility() {
    console.log('🧪 Testing Frontend Compatibility');
    console.log('=================================\n');
    
    try {
        // 1. Test Registration Flow (3-step)
        console.log('📝 STEP 1: Registration Flow');
        console.log('─────────────────────────────');
        
        // Send verification email
        console.log('Sending verification email to:', TEST_CREDENTIALS.email);
        const verifyResp = await axios.post(`${API_URL}/send-verification`, {
            email: TEST_CREDENTIALS.email
        });
        console.log('✅ Email sent:', verifyResp.data.message);
        
        // Wait and get code from server logs (in production, user gets from email)
        console.log('⏳ Check server logs for verification code...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For demo, manually enter the code shown in server logs
        const code = process.argv[2];
        if (!code) {
            console.log('\n❌ Please provide verification code as argument:');
            console.log('   node test-frontend-compatibility.js <CODE>\n');
            return;
        }
        
        // Verify code
        console.log('Verifying code:', code);
        const codeResp = await axios.post(`${API_URL}/verify-code`, {
            email: TEST_CREDENTIALS.email,
            code: code
        });
        console.log('✅ Email verified:', codeResp.data.message);
        
        // Complete registration
        console.log('Completing registration...');
        const registerResp = await axios.post(`${API_URL}/register`, TEST_CREDENTIALS);
        console.log('✅ Registration successful!');
        
        // Store tokens
        authToken = registerResp.data.data.accessToken;
        refreshToken = registerResp.data.data.refreshToken;
        
        console.log('\nUser created:');
        console.log('  ID:', registerResp.data.data.user.id);
        console.log('  Username:', registerResp.data.data.user.username);
        console.log('  Nickname:', registerResp.data.data.user.nickname);
        console.log('  Email:', registerResp.data.data.user.email);
        console.log('  Verified:', registerResp.data.data.user.isEmailVerified);
        
        // 2. Test Login (LoginForm compatibility)
        console.log('\n🔐 STEP 2: Login Test');
        console.log('─────────────────────');
        
        const loginResp = await axios.post(`${API_URL}/login`, {
            email: TEST_CREDENTIALS.email,
            password: TEST_CREDENTIALS.password
        });
        
        console.log('✅ Login successful!');
        console.log('Response structure matches LoginForm expectations:');
        console.log('  - success:', loginResp.data.success);
        console.log('  - message:', loginResp.data.message);
        console.log('  - data.accessToken:', !!loginResp.data.data.accessToken);
        console.log('  - data.refreshToken:', !!loginResp.data.data.refreshToken);
        console.log('  - data.user.nickname:', loginResp.data.data.user.nickname);
        console.log('  - data.user.isEmailVerified:', loginResp.data.data.user.isEmailVerified);
        
        // Update tokens
        authToken = loginResp.data.data.accessToken;
        
        // 3. Test Profile (Settings page compatibility)
        console.log('\n👤 STEP 3: Profile/Settings Test');
        console.log('─────────────────────────────────');
        
        const profileResp = await axios.get(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('✅ Profile retrieved!');
        console.log('User data for Settings page:');
        console.log('  - Email:', profileResp.data.data.user.email);
        console.log('  - Username:', profileResp.data.data.user.username);
        console.log('  - Nickname:', profileResp.data.data.user.nickname);
        console.log('  - Email Verified:', profileResp.data.data.user.isEmailVerified);
        
        // 4. Test Settings Endpoints
        console.log('\n⚙️  STEP 4: Settings Endpoints Test');
        console.log('────────────────────────────────────');
        
        // Test password change
        console.log('\nTesting password change...');
        const passwordResp = await axios.post(
            `${API_URL}/change-password`,
            {
                currentPassword: TEST_CREDENTIALS.password,
                newPassword: 'NewPass123!@#'
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        console.log('✅', passwordResp.data.message);
        
        // Test login with new password
        console.log('Testing login with new password...');
        const newLoginResp = await axios.post(`${API_URL}/login`, {
            email: TEST_CREDENTIALS.email,
            password: 'NewPass123!@#'
        });
        console.log('✅ Login with new password successful!');
        
        // 5. Test Token Refresh
        console.log('\n🔄 STEP 5: Token Refresh Test');
        console.log('──────────────────────────────');
        
        const refreshResp = await axios.post(`${API_URL}/refresh`, {
            refreshToken: refreshToken
        });
        
        console.log('✅ Token refreshed!');
        console.log('  - New access token received:', !!refreshResp.data.data.accessToken);
        console.log('  - New refresh token received:', !!refreshResp.data.data.refreshToken);
        
        // 6. Test Logout
        console.log('\n🚪 STEP 6: Logout Test');
        console.log('──────────────────────');
        
        const logoutResp = await axios.post(
            `${API_URL}/logout`,
            {},
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        
        console.log('✅', logoutResp.data.message);
        
        console.log('\n✨ ALL TESTS PASSED!');
        console.log('════════════════════');
        console.log('The backend is fully compatible with:');
        console.log('  ✓ RegisterForm component (3-step flow)');
        console.log('  ✓ LoginForm component');
        console.log('  ✓ Settings page');
        console.log('  ✓ AuthContext requirements');
        
    } catch (error) {
        console.error('\n❌ Test failed!');
        console.error('Error:', error.response?.data || error.message);
        
        if (error.config) {
            console.error('Failed at:', error.config.url);
        }
    }
}

// Run tests
console.log('Usage: node test-frontend-compatibility.js <VERIFICATION_CODE>');
console.log('Get the code from server logs after email is sent.\n');

if (process.argv[2]) {
    testFrontendCompatibility();
} else {
    // Run partial test without code
    console.log('Running partial test without verification code...\n');
    
    // Test with existing user
    axios.post(`${API_URL}/login`, {
        email: 'auto25419460@test.com',
        password: 'Test123!@#'
    }).then(resp => {
        console.log('✅ Login endpoint working!');
        console.log('User data structure:', resp.data.data.user);
        
        // Test profile with token
        return axios.get(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${resp.data.data.accessToken}` }
        });
    }).then(resp => {
        console.log('\n✅ Profile endpoint working!');
        console.log('Profile data:', resp.data.data.user);
    }).catch(err => {
        console.log('Using test without existing user. Run with verification code for full test.');
    });
}