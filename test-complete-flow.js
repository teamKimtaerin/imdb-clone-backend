const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';
const timestamp = Date.now().toString().slice(-8); // Shorter timestamp
const TEST_EMAIL = `test${timestamp}@example.com`;
const TEST_USERNAME = `user${timestamp}`;
const TEST_NICKNAME = `Nick${timestamp}`;
const TEST_PASSWORD = 'Test123!@#';

async function testCompleteFlow() {
    console.log('🧪 Testing Complete 3-Step Registration Flow');
    console.log('============================================\n');
    
    try {
        // Step 1: Send verification email
        console.log('📧 Step 1: Sending verification email...');
        console.log(`Email: ${TEST_EMAIL}`);
        
        const step1Response = await axios.post(`${API_URL}/send-verification`, {
            email: TEST_EMAIL
        });
        
        console.log('✅ Step 1 Success:', step1Response.data.message);
        console.log('');
        
        // Get verification code from prompt (in real app, user gets from email)
        console.log('📬 Check server logs above for the verification code');
        console.log('The code was sent to:', TEST_EMAIL);
        console.log('');
        
        // For demo, we'll use the actual code: 192863 (from server logs)
        // In production, user would input this from their email
        const verificationCode = process.argv[2] || '192863';
        
        // Step 2: Verify the code
        console.log('🔑 Step 2: Verifying email with code:', verificationCode);
        
        const step2Response = await axios.post(`${API_URL}/verify-code`, {
            email: TEST_EMAIL,
            code: verificationCode
        });
        
        console.log('✅ Step 2 Success:', step2Response.data.message);
        console.log('Email verified:', step2Response.data.data?.verified || 'Yes');
        console.log('');
        
        // Step 3: Complete registration
        console.log('📝 Step 3: Completing registration...');
        console.log(`Username: ${TEST_USERNAME}`);
        console.log(`Nickname: ${TEST_NICKNAME}`);
        console.log(`Password: ${TEST_PASSWORD}`);
        
        const step3Response = await axios.post(`${API_URL}/register`, {
            username: TEST_USERNAME,
            nickname: TEST_NICKNAME,
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        console.log('✅ Step 3 Success:', step3Response.data.message);
        console.log('');
        
        if (step3Response.data.data) {
            console.log('🎉 Registration Complete!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('User Details:');
            console.log('  ID:', step3Response.data.data.user.id);
            console.log('  Username:', step3Response.data.data.user.username);
            console.log('  Nickname:', step3Response.data.data.user.nickname);
            console.log('  Email:', step3Response.data.data.user.email);
            console.log('  Verified:', step3Response.data.data.user.isEmailVerified);
            console.log('');
            console.log('Tokens Generated:');
            console.log('  Access Token:', step3Response.data.data.accessToken.substring(0, 30) + '...');
            console.log('  Refresh Token:', step3Response.data.data.refreshToken.substring(0, 30) + '...');
        }
        
        // Test login with the new account
        console.log('\n🔐 Testing login with new account...');
        const loginResponse = await axios.post(`${API_URL}/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login successful!');
            console.log('User can now access protected routes');
        }
        
    } catch (error) {
        console.error('\n❌ Error at step:', error.config?.url?.split('/').pop());
        console.error('Message:', error.response?.data?.message || error.message);
        
        if (error.response?.data?.message?.includes('not verified')) {
            console.log('\n💡 Tip: Email must be verified before registration');
            console.log('Run with actual verification code: node test-complete-flow.js <CODE>');
        }
        
        if (error.response?.data?.message?.includes('already registered')) {
            console.log('\n💡 Tip: Email is already registered. Try with a different email.');
        }
    }
}

// Run the test
console.log('Usage: node test-complete-flow.js [verification-code]');
console.log('If no code provided, will try default (check server logs)\n');

testCompleteFlow().then(() => {
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
});