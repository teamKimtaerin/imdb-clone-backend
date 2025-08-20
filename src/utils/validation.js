// 입력값 검증 유틸리티

// XSS 방지를 위한 입력값 정제
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '');
};

// 이메일 유효성 검사
const validateEmail = (email) => {
    const errors = [];
    
    if (!email) {
        errors.push('Email is required');
        return errors;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    return errors;
};

// 비밀번호 유효성 검사
const validatePassword = (password) => {
    const errors = [];
    
    if (!password) {
        errors.push('Password is required');
        return errors;
    }
    
    if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    if (password.length > 100) {
        errors.push('Password cannot exceed 100 characters');
    }
    
    return errors;
};

// 사용자명 유효성 검사
const validateUsername = (username) => {
    const errors = [];
    
    if (!username) {
        errors.push('Username is required');
        return errors;
    }
    
    if (username.length < 3) {
        errors.push('Username must be at least 3 characters');
    }
    
    if (username.length > 20) {
        errors.push('Username cannot exceed 20 characters');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    return errors;
};

// 닉네임 유효성 검사
const validateNickname = (nickname) => {
    const errors = [];
    
    if (!nickname) {
        errors.push('닉네임은 필수입니다.');
        return errors;
    }
    
    if (nickname.length < 2) {
        errors.push('닉네임은 최소 2자 이상이어야 합니다.');
    }
    
    if (nickname.length > 20) {
        errors.push('닉네임은 20자를 초과할 수 없습니다.');
    }
    
    return errors;
};

// 회원가입 데이터 검증
const validateRegistrationData = (data) => {
    const errors = [];
    
    // 이메일 검증
    const emailErrors = validateEmail(data.email);
    if (emailErrors.length > 0) {
        errors.push(...emailErrors);
    }
    
    // 비밀번호 검증
    const passwordErrors = validatePassword(data.password);
    if (passwordErrors.length > 0) {
        errors.push(...passwordErrors);
    }
    
    // 사용자명 검증
    const usernameErrors = validateUsername(data.username);
    if (usernameErrors.length > 0) {
        errors.push(...usernameErrors);
    }
    
    return { 
        isValid: errors.length === 0, 
        errors 
    };
};

// 로그인 데이터 검증
const validateLoginData = (data) => {
    const errors = [];
    
    // 이메일 검증
    const emailErrors = validateEmail(data.email);
    if (emailErrors.length > 0) {
        errors.push(...emailErrors);
    }
    
    // 비밀번호 검증 (로그인 시에는 간단한 검증만)
    if (!data.password) {
        errors.push('Password is required');
    }
    
    return { 
        isValid: errors.length === 0, 
        errors 
    };
};

module.exports = {
    sanitizeInput,
    validateEmail,
    validatePassword,
    validateUsername,
    validateNickname,
    validateRegistrationData,
    validateLoginData
};