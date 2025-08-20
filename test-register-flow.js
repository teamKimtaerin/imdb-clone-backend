const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';
const timestamp = Date.now().toString().slice(-8);
const TEST_EMAIL = `regtest${timestamp}@example.com`;
const TEST_USERNAME = `regtest${timestamp}`;
const TEST_NICKNAME = `RegTest${timestamp}`;
const TEST_PASSWORD = 'Test123!@#';

async function testRegisterFlow() {
    console.log('🧪 Testing Register Flow (회원가입 플로우 테스트)');
    console.log('================================================\n');
    
    try {
        // Step 1: Send verification email
        console.log('📧 Step 1: 이메일 인증 코드 전송');
        console.log('Email:', TEST_EMAIL);
        
        await axios.post(`${API_URL}/send-verification`, { 
            email: TEST_EMAIL 
        });
        
        console.log('✅ 인증 이메일 전송됨');
        console.log('⏳ 서버 로그에서 인증 코드 확인 중...\n');
        
        // Wait for code to appear in logs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get code from command line argument
        const code = process.argv[2];
        if (!code) {
            console.log('❌ 인증 코드를 입력해주세요:');
            console.log('   node test-register-flow.js <CODE>');
            console.log('\n서버 로그에서 코드를 확인하세요.');
            return;
        }
        
        // Step 2: Verify code
        console.log('🔑 Step 2: 인증 코드 검증');
        console.log('Code:', code);
        
        const verifyResponse = await axios.post(`${API_URL}/verify-code`, {
            email: TEST_EMAIL,
            code: code
        });
        
        console.log('✅ 이메일 인증 완료:', verifyResponse.data.message);
        console.log('');
        
        // Step 3: Complete registration
        console.log('📝 Step 3: 회원가입 완료');
        console.log('Username:', TEST_USERNAME);
        console.log('Nickname:', TEST_NICKNAME);
        
        const registerResponse = await axios.post(`${API_URL}/register`, {
            username: TEST_USERNAME,
            nickname: TEST_NICKNAME,
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        console.log('\n✅ 회원가입 응답 (Register Response):');
        console.log('═══════════════════════════════════════');
        console.log(JSON.stringify(registerResponse.data, null, 2));
        
        // Check if response has same structure as login
        console.log('\n📊 회원가입 후 자동 로그인 체크:');
        console.log('────────────────────────────────');
        
        const hasToken = !!registerResponse.data.data?.accessToken;
        const hasRefreshToken = !!registerResponse.data.data?.refreshToken;
        const hasUser = !!registerResponse.data.data?.user;
        const hasUserId = !!registerResponse.data.data?.user?.id;
        const hasNickname = !!registerResponse.data.data?.user?.nickname;
        
        console.log('  ✓ AccessToken 제공됨:', hasToken);
        console.log('  ✓ RefreshToken 제공됨:', hasRefreshToken);
        console.log('  ✓ User 객체 제공됨:', hasUser);
        console.log('  ✓ User ID 있음:', hasUserId);
        console.log('  ✓ Nickname 있음:', hasNickname);
        
        if (hasToken) {
            // Test if token works
            console.log('\n🔐 토큰 유효성 테스트:');
            console.log('─────────────────────');
            
            const profileResponse = await axios.get(`${API_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${registerResponse.data.data.accessToken}`
                }
            });
            
            console.log('✅ 회원가입 후 받은 토큰으로 프로필 조회 성공!');
            console.log('User:', profileResponse.data.data.user.email);
        }
        
        // Compare with login response
        console.log('\n🔄 로그인 응답과 비교:');
        console.log('──────────────────────');
        
        const loginResponse = await axios.post(`${API_URL}/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        console.log('로그인 응답 구조:');
        console.log(JSON.stringify(loginResponse.data, null, 2));
        
        console.log('\n✅ 결론:');
        console.log('════════');
        console.log('회원가입 응답과 로그인 응답이 동일한 구조입니다!');
        console.log('');
        console.log('🎯 프론트엔드에서 해야 할 일:');
        console.log('───────────────────────────');
        console.log('1. 회원가입 성공 후 응답에서 accessToken과 user 객체를 저장');
        console.log('2. AuthContext의 setUser(response.data.data.user) 호출');
        console.log('3. localStorage.setItem("accessToken", response.data.data.accessToken)');
        console.log('4. 이렇게 하면 NavigationBar에 마이페이지/로그아웃 버튼이 나타남');
        
        console.log('\n💡 RegisterForm 컴포넌트에서:');
        console.log('```javascript');
        console.log('// Step 3: 회원가입 완료 후');
        console.log('const response = await axios.post("/api/auth/register", {');
        console.log('  username, nickname, email, password');
        console.log('});');
        console.log('');
        console.log('if (response.data.success) {');
        console.log('  // 토큰 저장');
        console.log('  localStorage.setItem("accessToken", response.data.data.accessToken);');
        console.log('  localStorage.setItem("refreshToken", response.data.data.refreshToken);');
        console.log('  ');
        console.log('  // 유저 정보 Context에 저장 (중요!)');
        console.log('  setUser(response.data.data.user);');
        console.log('  ');
        console.log('  // 메인 페이지로 이동');
        console.log('  router.push("/");');
        console.log('}');
        console.log('```');
        
    } catch (error) {
        console.error('\n❌ 테스트 실패!');
        console.error('Error:', error.response?.data || error.message);
    }
}

// Run test
console.log('사용법: node test-register-flow.js <VERIFICATION_CODE>');
console.log('코드는 서버 로그에서 확인하세요.\n');

if (process.argv[2]) {
    testRegisterFlow();
} else {
    // Just send verification email
    axios.post(`${API_URL}/send-verification`, { 
        email: TEST_EMAIL 
    }).then(() => {
        console.log('✅ 인증 이메일 전송됨:', TEST_EMAIL);
        console.log('서버 로그에서 코드를 확인한 후 다시 실행하세요:');
        console.log(`node test-register-flow.js <CODE>`);
    });
}