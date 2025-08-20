// Validation utilities for authentication

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    const errors = [];
    
    if (!password || password.length < 8) {
        errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('비밀번호는 소문자를 포함해야 합니다.');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('비밀번호는 대문자를 포함해야 합니다.');
    }
    
    if (!/(?=.*\d)/.test(password)) {
        errors.push('비밀번호는 숫자를 포함해야 합니다.');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateUsername = (username) => {
    const errors = [];
    
    if (!username || username.trim().length === 0) {
        errors.push('사용자명은 필수입니다.');
    }
    
    if (username && username.length > 20) {
        errors.push('사용자명은 20자를 초과할 수 없습니다.');
    }
    
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('사용자명은 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateNickname = (nickname) => {
    const errors = [];
    
    if (!nickname || nickname.trim().length === 0) {
        errors.push('닉네임은 필수입니다.');
    }
    
    if (nickname && nickname.length < 2) {
        errors.push('닉네임은 최소 2자 이상이어야 합니다.');
    }
    
    if (nickname && nickname.length > 20) {
        errors.push('닉네임은 20자를 초과할 수 없습니다.');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateRegistrationData = (data) => {
    const { username, email, password, confirmPassword, nickname } = data;
    const errors = {};
    
    // Email validation
    if (!email) {
        errors.email = ['이메일은 필수입니다.'];
    } else if (!validateEmail(email)) {
        errors.email = ['유효한 이메일 주소를 입력해주세요.'];
    }
    
    // Username validation
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
        errors.username = usernameValidation.errors;
    }
    
    // Nickname validation
    const nicknameValidation = validateNickname(nickname);
    if (!nicknameValidation.isValid) {
        errors.nickname = nicknameValidation.errors;
    }
    
    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors;
    }
    
    // Confirm password (only if provided)
    if (confirmPassword !== undefined) {
        if (!confirmPassword) {
            if (!errors.password) errors.password = [];
            errors.password.push('비밀번호 확인은 필수입니다.');
        } else if (password !== confirmPassword) {
            if (!errors.password) errors.password = [];
            errors.password.push('비밀번호가 일치하지 않습니다.');
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

const validateLoginData = (data) => {
    const { email, password } = data;
    const errors = {};
    
    if (!email) {
        errors.email = ['이메일은 필수입니다.'];
    } else if (!validateEmail(email)) {
        errors.email = ['유효한 이메일 주소를 입력해주세요.'];
    }
    
    if (!password) {
        errors.password = ['비밀번호는 필수입니다.'];
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim();
};

module.exports = {
    validateEmail,
    validatePassword,
    validateUsername,
    validateNickname,
    validateRegistrationData,
    validateLoginData,
    sanitizeInput
};