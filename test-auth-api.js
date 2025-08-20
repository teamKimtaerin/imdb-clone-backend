// 백엔드 Auth API 테스트 스크립트
const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_USER = {
    username: `testuser${Date.now()}`,
    email: TEST_EMAIL,
    password: 'Test1234!',
    nickname: '테스트유저'
};

let verificationCode = null;
let authToken = null;
let resetToken = null;

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. 이메일 인증 요청 테스트
async function testSendVerification() {
    try {
        log('\n1. 이메일 인증 요청 테스트', 'blue');
        const response = await axios.post(`${API_URL}/send-verification`, {
            email: TEST_EMAIL
        });
        
        if (response.data.success) {
            log('✓ 이메일 인증 코드 전송 성공', 'green');
            log(`  메시지: ${response.data.message}`, 'yellow');
            
            // 개발 환경에서는 콘솔에서 코드를 확인
            log('  (서버 콘솔에서 인증 코드를 확인하세요)', 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 이메일 인증 요청 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 2. 이메일 인증 확인 테스트
async function testVerifyCode(code) {
    try {
        log('\n2. 이메일 인증 확인 테스트', 'blue');
        const response = await axios.post(`${API_URL}/verify-code`, {
            email: TEST_EMAIL,
            code: code
        });
        
        if (response.data.success) {
            log('✓ 이메일 인증 성공', 'green');
            log(`  메시지: ${response.data.message}`, 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 이메일 인증 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 3. 회원가입 테스트
async function testRegister() {
    try {
        log('\n3. 회원가입 테스트', 'blue');
        const response = await axios.post(`${API_URL}/register`, TEST_USER);
        
        if (response.data.success) {
            authToken = response.data.data.token;
            log('✓ 회원가입 성공', 'green');
            log(`  사용자: ${response.data.data.user.username}`, 'yellow');
            log(`  이메일: ${response.data.data.user.email}`, 'yellow');
            log(`  토큰: ${authToken.substring(0, 20)}...`, 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 회원가입 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 4. 로그인 테스트
async function testLogin() {
    try {
        log('\n4. 로그인 테스트', 'blue');
        const response = await axios.post(`${API_URL}/login`, {
            email: TEST_EMAIL,
            password: TEST_USER.password
        });
        
        if (response.data.success) {
            authToken = response.data.data.token;
            log('✓ 로그인 성공', 'green');
            log(`  사용자: ${response.data.data.user.username}`, 'yellow');
            log(`  토큰: ${authToken.substring(0, 20)}...`, 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 로그인 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 5. 프로필 조회 테스트
async function testGetProfile() {
    try {
        log('\n5. 프로필 조회 테스트', 'blue');
        const response = await axios.get(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.data.success) {
            log('✓ 프로필 조회 성공', 'green');
            log(`  사용자명: ${response.data.data.user.username}`, 'yellow');
            log(`  닉네임: ${response.data.data.user.nickname}`, 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 프로필 조회 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 6. 비밀번호 찾기 테스트
async function testForgotPassword() {
    try {
        log('\n6. 비밀번호 찾기 요청 테스트', 'blue');
        const response = await axios.post(`${API_URL}/forgot-password`, {
            email: TEST_EMAIL
        });
        
        if (response.data.success) {
            log('✓ 비밀번호 재설정 코드 전송 성공', 'green');
            log(`  메시지: ${response.data.message}`, 'yellow');
            log('  (서버 콘솔에서 재설정 코드를 확인하세요)', 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 비밀번호 찾기 요청 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 7. 비밀번호 재설정 코드 검증
async function testVerifyResetCode(code) {
    try {
        log('\n7. 비밀번호 재설정 코드 검증 테스트', 'blue');
        const response = await axios.post(`${API_URL}/verify-reset-code`, {
            email: TEST_EMAIL,
            code: code
        });
        
        if (response.data.success) {
            resetToken = response.data.data.resetToken;
            log('✓ 재설정 코드 검증 성공', 'green');
            log(`  메시지: ${response.data.message}`, 'yellow');
            log(`  재설정 토큰: ${resetToken.substring(0, 20)}...`, 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 재설정 코드 검증 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 8. 비밀번호 재설정
async function testResetPassword() {
    try {
        log('\n8. 비밀번호 재설정 테스트', 'blue');
        const response = await axios.post(`${API_URL}/reset-password`, {
            resetToken: resetToken,
            newPassword: 'NewPassword123!'
        });
        
        if (response.data.success) {
            log('✓ 비밀번호 재설정 성공', 'green');
            log(`  메시지: ${response.data.message}`, 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 비밀번호 재설정 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 9. 로그아웃 테스트
async function testLogout() {
    try {
        log('\n9. 로그아웃 테스트', 'blue');
        const response = await axios.post(`${API_URL}/logout`, {}, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.data.success) {
            log('✓ 로그아웃 성공', 'green');
            log(`  메시지: ${response.data.message}`, 'yellow');
            return true;
        }
    } catch (error) {
        log('✗ 로그아웃 실패', 'red');
        log(`  에러: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// 대화형 테스트 실행
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function runInteractiveTests() {
    log('\n=== 백엔드 Auth API 테스트 시작 ===\n', 'blue');
    
    // 1. 이메일 인증 요청
    await testSendVerification();
    
    // 2. 인증 코드 입력 대기
    const verifyCode = await new Promise(resolve => {
        rl.question('\n이메일 인증 코드를 입력하세요: ', resolve);
    });
    
    if (verifyCode) {
        await testVerifyCode(verifyCode);
        
        // 3. 회원가입
        await testRegister();
        
        // 4. 로그인
        await testLogin();
        
        // 5. 프로필 조회
        await testGetProfile();
        
        // 6. 비밀번호 찾기
        await testForgotPassword();
        
        // 7. 재설정 코드 입력 대기
        const resetCode = await new Promise(resolve => {
            rl.question('\n비밀번호 재설정 코드를 입력하세요: ', resolve);
        });
        
        if (resetCode) {
            await testVerifyResetCode(resetCode);
            
            // 8. 비밀번호 재설정
            await testResetPassword();
            
            // 9. 새 비밀번호로 로그인 테스트
            log('\n새 비밀번호로 로그인 테스트', 'blue');
            try {
                const response = await axios.post(`${API_URL}/login`, {
                    email: TEST_EMAIL,
                    password: 'NewPassword123!'
                });
                
                if (response.data.success) {
                    log('✓ 새 비밀번호로 로그인 성공', 'green');
                }
            } catch (error) {
                log('✗ 새 비밀번호로 로그인 실패', 'red');
            }
        }
        
        // 10. 로그아웃
        await testLogout();
    }
    
    log('\n=== 테스트 완료 ===\n', 'blue');
    rl.close();
}

// 자동 테스트 실행 (인증 코드 없이)
async function runAutoTests() {
    log('\n=== 백엔드 Auth API 자동 테스트 ===\n', 'blue');
    
    // 잘못된 로그인 시도
    log('\n잘못된 로그인 테스트', 'blue');
    try {
        await axios.post(`${API_URL}/login`, {
            email: 'wrong@example.com',
            password: 'WrongPassword'
        });
    } catch (error) {
        log('✓ 예상대로 로그인 실패', 'green');
        log(`  에러: ${error.response?.data?.message}`, 'yellow');
    }
    
    // 인증 없이 프로필 조회
    log('\n인증 없이 프로필 조회 테스트', 'blue');
    try {
        await axios.get(`${API_URL}/profile`);
    } catch (error) {
        log('✓ 예상대로 인증 실패', 'green');
        log(`  에러: ${error.response?.data?.message}`, 'yellow');
    }
    
    // 잘못된 이메일 형식
    log('\n잘못된 이메일 형식 테스트', 'blue');
    try {
        await axios.post(`${API_URL}/send-verification`, {
            email: 'invalid-email'
        });
    } catch (error) {
        log('✓ 예상대로 유효성 검사 실패', 'green');
        log(`  에러: ${error.response?.data?.message}`, 'yellow');
    }
    
    log('\n=== 자동 테스트 완료 ===\n', 'blue');
}

// 실행 모드 선택
const args = process.argv.slice(2);
if (args.includes('--auto')) {
    runAutoTests();
} else {
    runInteractiveTests();
}