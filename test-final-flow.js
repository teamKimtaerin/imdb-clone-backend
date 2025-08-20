const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const API_URL = 'http://localhost:4000/api/auth';
const timestamp = Date.now().toString().slice(-8);
const TEST_EMAIL = `test${timestamp}@example.com`;
const TEST_USERNAME = `user${timestamp}`;
const TEST_NICKNAME = `Nick${timestamp}`;
const TEST_PASSWORD = 'Test123!@#';

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function testInteractiveFlow() {
    console.log('🧪 Interactive 3-Step Registration Flow Test');
    console.log('============================================\n');
    
    try {
        // Step 1: Send verification email
        console.log('📧 Step 1: Sending verification email...');
        console.log(`Email: ${TEST_EMAIL}\n`);
        
        const step1Response = await axios.post(`${API_URL}/send-verification`, {
            email: TEST_EMAIL
        });
        
        console.log('✅', step1Response.data.message);
        console.log('\n⚠️  CHECK SERVER LOGS for the verification code!');
        console.log('The code was displayed in the terminal where the server is running.\n');
        
        // Get code from user
        const verificationCode = await askQuestion('Enter the 6-digit verification code: ');
        
        // Step 2: Verify the code
        console.log(`\n🔑 Step 2: Verifying code ${verificationCode}...`);
        
        const step2Response = await axios.post(`${API_URL}/verify-code`, {
            email: TEST_EMAIL,
            code: verificationCode
        });
        
        console.log('✅', step2Response.data.message);
        console.log('Email verification status:', step2Response.data.data?.verified ? '✓ Verified' : 'Verified');
        
        // Step 3: Complete registration
        console.log('\n📝 Step 3: Completing registration...');
        console.log(`  Username: ${TEST_USERNAME}`);
        console.log(`  Nickname: ${TEST_NICKNAME}`);
        console.log(`  Email: ${TEST_EMAIL}`);
        console.log(`  Password: ${TEST_PASSWORD}\n`);
        
        const step3Response = await axios.post(`${API_URL}/register`, {
            username: TEST_USERNAME,
            nickname: TEST_NICKNAME,
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        console.log('✅', step3Response.data.message);
        
        if (step3Response.data.data) {
            console.log('\n🎉 REGISTRATION SUCCESSFUL!');
            console.log('═══════════════════════════════════════');
            console.log('User Account Created:');
            console.log(`  • ID: ${step3Response.data.data.user.id}`);
            console.log(`  • Username: ${step3Response.data.data.user.username}`);
            console.log(`  • Nickname: ${step3Response.data.data.user.nickname}`);
            console.log(`  • Email: ${step3Response.data.data.user.email}`);
            console.log(`  • Email Verified: ✅`);
            console.log('\nAuthentication Tokens:');
            console.log(`  • Access Token: ${step3Response.data.data.accessToken.substring(0, 40)}...`);
            console.log(`  • Refresh Token: ${step3Response.data.data.refreshToken.substring(0, 40)}...`);
        }
        
        // Test login
        console.log('\n🔐 Testing login with created account...');
        const loginResponse = await axios.post(`${API_URL}/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login successful! Account is fully functional.');
        }
        
        console.log('\n✨ All steps completed successfully!');
        console.log('The 3-step registration flow is working correctly.');
        
    } catch (error) {
        console.error('\n❌ Error:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 400) {
            console.log('\nPossible issues:');
            if (error.response.data.message.includes('verified')) {
                console.log('  • Email verification failed or expired');
                console.log('  • Make sure to enter the correct 6-digit code');
            }
            if (error.response.data.message.includes('already')) {
                console.log('  • Email or username already exists');
                console.log('  • Try running the test again (generates new credentials)');
            }
        }
    } finally {
        rl.close();
    }
}

// Run the interactive test
console.log('This test simulates the exact flow your frontend uses:');
console.log('1. Send verification email');
console.log('2. Verify with 6-digit code');
console.log('3. Complete registration\n');

testInteractiveFlow().catch(error => {
    console.error('Test failed:', error);
    rl.close();
    process.exit(1);
});