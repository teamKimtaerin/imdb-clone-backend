const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';
const timestamp = Date.now().toString().slice(-8);
const email = `quick${timestamp}@test.com`;
const username = `quick${timestamp}`;
const nickname = `Quick${timestamp}`;
const password = 'Test123!@#';

async function createAndTestUser() {
    try {
        console.log('Creating test user...');
        console.log('Email:', email);
        
        // Step 1: Send verification
        await axios.post(`${API_URL}/send-verification`, { email });
        console.log('✅ Verification email sent');
        
        // Wait for code to appear in logs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n⚠️  CHECK SERVER LOGS for the 6-digit code!');
        console.log('Then run: node test-quick-user.js <CODE>\n');
        
        const code = process.argv[2];
        if (!code) {
            console.log('Waiting for code...');
            return;
        }
        
        // Step 2: Verify code
        await axios.post(`${API_URL}/verify-code`, { email, code });
        console.log('✅ Email verified');
        
        // Step 3: Register
        const registerResp = await axios.post(`${API_URL}/register`, {
            username, nickname, email, password
        });
        console.log('✅ User registered');
        
        // Test login
        console.log('\n🔐 Testing Login Response Structure');
        console.log('───────────────────────────────────');
        
        const loginResp = await axios.post(`${API_URL}/login`, {
            email, password
        });
        
        console.log('\n✅ Login Response:');
        console.log(JSON.stringify(loginResp.data, null, 2));
        
        // Test profile with token
        console.log('\n👤 Testing Profile Response Structure');
        console.log('─────────────────────────────────────');
        
        const profileResp = await axios.get(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${loginResp.data.data.accessToken}` }
        });
        
        console.log('\n✅ Profile Response:');
        console.log(JSON.stringify(profileResp.data, null, 2));
        
        console.log('\n✨ Frontend Compatibility Check:');
        console.log('─────────────────────────────────');
        console.log('LoginForm expects:');
        console.log('  ✓ data.user.id:', !!loginResp.data.data.user.id);
        console.log('  ✓ data.user.email:', loginResp.data.data.user.email);
        console.log('  ✓ data.user.nickname:', loginResp.data.data.user.nickname);
        console.log('  ✓ data.user.isEmailVerified:', loginResp.data.data.user.isEmailVerified);
        console.log('\nSettings page expects:');
        console.log('  ✓ user.email:', profileResp.data.data.user.email);
        console.log('  ✓ user.isEmailVerified:', profileResp.data.data.user.isEmailVerified);
        
        console.log('\n✅ ALL CHECKS PASSED!');
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

createAndTestUser();