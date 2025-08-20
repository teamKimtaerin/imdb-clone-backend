const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';
const TEST_EMAIL = 'testuser' + Date.now() + '@example.com';
const TEST_USERNAME = 'testuser' + Date.now();
const TEST_NICKNAME = 'TestNick' + Date.now();
const TEST_PASSWORD = 'Test123!@#';

let verificationCode = null;

async function test3StepFlow() {
    console.log('🧪 Testing 3-Step Registration Flow');
    console.log('=====================================\n');
    
    try {
        // Step 1: Send verification email (like frontend does)
        console.log('📧 Step 1: Sending verification email...');
        console.log(`Email: ${TEST_EMAIL}`);
        
        const step1Response = await axios.post(`${API_URL}/send-verification`, {
            email: TEST_EMAIL
        });
        
        console.log('✅ Step 1 Response:', step1Response.data);
        console.log('');
        
        // In real scenario, user would get code from email
        // For testing, we'll simulate getting it from the database
        console.log('⏸️  Simulating email retrieval (check your email for the code)...');
        console.log('For testing, enter code manually or check server logs');
        console.log('');
        
        // Step 2: Verify the code (simulate user entering code)
        console.log('🔑 Step 2: Verifying email code...');
        
        // For demonstration, use a dummy code (in production, user enters from email)
        const dummyCode = '123456'; // You would need to check actual email or logs
        console.log(`Using code: ${dummyCode} (replace with actual code from email)`);
        
        try {
            const step2Response = await axios.post(`${API_URL}/verify-code`, {
                email: TEST_EMAIL,
                code: dummyCode
            });
            
            console.log('✅ Step 2 Response:', step2Response.data);
        } catch (error) {
            console.log('❌ Step 2 Failed (expected if dummy code):', error.response?.data);
            console.log('Note: Use the actual code from the email to proceed');
        }
        console.log('');
        
        // Step 3: Complete registration with username, nickname, password
        console.log('📝 Step 3: Completing registration...');
        console.log(`Username: ${TEST_USERNAME}`);
        console.log(`Nickname: ${TEST_NICKNAME}`);
        
        const step3Response = await axios.post(`${API_URL}/register`, {
            username: TEST_USERNAME,
            nickname: TEST_NICKNAME,
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        console.log('✅ Step 3 Response:', step3Response.data);
        console.log('');
        
        if (step3Response.data.data?.accessToken) {
            console.log('🎉 Registration successful!');
            console.log('Access Token:', step3Response.data.data.accessToken.substring(0, 20) + '...');
            console.log('User:', step3Response.data.data.user);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        
        if (error.response?.status === 400 && error.response?.data?.message?.includes('verified')) {
            console.log('\n💡 Hint: Make sure to complete Step 2 with the actual verification code from email');
        }
    }
}

// Run the test
test3StepFlow().then(() => {
    console.log('\n✅ Test completed');
}).catch(error => {
    console.error('\n❌ Test failed:', error);
});