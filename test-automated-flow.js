const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:4000/api/auth';

// Connect to MongoDB to get verification code
async function getVerificationCode(email) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const EmailVerification = mongoose.model('EmailVerification', {
            email: String,
            verificationCode: String,
            isVerified: Boolean,
            expiresAt: Date
        });
        
        const verification = await EmailVerification.findOne({ email });
        await mongoose.disconnect();
        
        return verification?.verificationCode;
    } catch (error) {
        console.error('Error getting verification code:', error);
        return null;
    }
}

async function testAutomatedFlow() {
    const timestamp = Date.now().toString().slice(-8);
    const TEST_EMAIL = `auto${timestamp}@test.com`;
    const TEST_USERNAME = `auto${timestamp}`;
    const TEST_NICKNAME = `Auto${timestamp}`;
    const TEST_PASSWORD = 'Test123!@#';
    
    console.log('🤖 Automated 3-Step Registration Flow Test');
    console.log('==========================================\n');
    console.log('Test Credentials:');
    console.log(`  Email: ${TEST_EMAIL}`);
    console.log(`  Username: ${TEST_USERNAME}`);
    console.log(`  Nickname: ${TEST_NICKNAME}`);
    console.log(`  Password: ${TEST_PASSWORD}\n`);
    
    try {
        // Step 1: Send verification email
        console.log('📧 STEP 1: Send Verification Email');
        console.log('───────────────────────────────────');
        
        const step1 = await axios.post(`${API_URL}/send-verification`, {
            email: TEST_EMAIL
        });
        
        console.log('✅ Response:', step1.data);
        
        // Get the verification code from database
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB write
        const verificationCode = await getVerificationCode(TEST_EMAIL);
        
        if (!verificationCode) {
            throw new Error('Could not retrieve verification code from database');
        }
        
        console.log(`📬 Verification code retrieved: ${verificationCode}\n`);
        
        // Step 2: Verify the code
        console.log('🔑 STEP 2: Verify Email Code');
        console.log('───────────────────────────────');
        
        const step2 = await axios.post(`${API_URL}/verify-code`, {
            email: TEST_EMAIL,
            code: verificationCode
        });
        
        console.log('✅ Response:', step2.data);
        console.log(`✓ Email ${TEST_EMAIL} is now verified\n`);
        
        // Step 3: Complete registration
        console.log('📝 STEP 3: Complete Registration');
        console.log('───────────────────────────────');
        
        const step3 = await axios.post(`${API_URL}/register`, {
            username: TEST_USERNAME,
            nickname: TEST_NICKNAME,
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        console.log('✅ Response:', step3.data);
        
        if (step3.data.success && step3.data.data) {
            console.log('\n🎉 REGISTRATION COMPLETE!');
            console.log('═════════════════════════');
            const user = step3.data.data.user;
            console.log('User Created:');
            console.log(`  ID: ${user.id}`);
            console.log(`  Username: ${user.username}`);
            console.log(`  Nickname: ${user.nickname}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Verified: ${user.isEmailVerified ? '✅' : '❌'}`);
            console.log('\nTokens:');
            console.log(`  Access: ...${step3.data.data.accessToken.slice(-20)}`);
            console.log(`  Refresh: ...${step3.data.data.refreshToken.slice(-20)}`);
        }
        
        // Test login
        console.log('\n🔐 BONUS: Test Login');
        console.log('────────────────────');
        
        const loginTest = await axios.post(`${API_URL}/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        console.log('✅ Login successful:', loginTest.data.message);
        console.log(`  User: ${loginTest.data.data.user.username}`);
        console.log(`  Email: ${loginTest.data.data.user.email}`);
        
        console.log('\n✨ SUCCESS: All 3 steps completed!');
        console.log('The backend is fully compatible with the frontend flow.');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error('─────────────');
        console.error('Error:', error.response?.data || error.message);
        
        if (error.response?.data?.message) {
            console.error('\nServer says:', error.response.data.message);
        }
        
        process.exit(1);
    }
}

// Run the test
testAutomatedFlow().then(() => {
    console.log('\n✅ Test suite passed!\n');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});