const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const nodemailer = require('nodemailer'); // 이메일 전송을 위한 라이브러리 (설치 필요)
const crypto = require('crypto'); // 인증 코드 생성을 위한 라이브러리

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
    try {
        const {username, email, password, nickname} = req.body;

        if(!username || !email || !password || !nickname) {
            return res.status(400).json({
                success: false,
                message: '모든 필드를 입력해주세요.'
            });
        }
        const existingUser = await User.findOne({$or: [{email}, {username}]});
    
        if(existingUser) {
            return res.status(400).json({
                success: false,
                message: '이미 사용중인 이메일 또는 사용자 이름입니다.'
            });
        }

        const user = new User({
            username,
            email,
            password,
            nickname
        });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: '회원가입 성공',
            data: {
                token,
                user : {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    nickname: user.nickname,
                    profileImage: user.profileImage
                }
            }
        })
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다.',
            error: error.message
        });
    }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 확인
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요'
      });
    }

    // 사용자 찾기 (비밀번호 포함)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 잘못되었습니다'
      });
    }

    // 계정 활성화 확인
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '비활성화된 계정입니다'
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 잘못되었습니다'
      });
    }

    // 마지막 로그인 시간 업데이트
    user.lastLoginAt = new Date();
    await user.save();

    // JWT 토큰 생성
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          profileImage: user.profileImage,
          preferences: user.preferences,
          recentSearches: user.recentSearches
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if(!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: {user}
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필을 가져오는 중 오류가 발생했습니다.',
            error: error.message
        });
    }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // 문자열이므로 변환 필요
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 비밀번호 찾기 (이메일 전송)
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 6자리 랜덤 인증 코드 생성
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // 생성된 코드를 DB에 저장 (만료 시간 설정)
    await User.saveVerificationCode(user.email, verificationCode);

    // 사용자에게 이메일 전송
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '비밀번호 재설정 인증 코드',
      text: `안녕하세요. 비밀번호 재설정을 위한 인증 코드입니다: ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: '인증코드가 이메일로 전송되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// 인증 코드 검증
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const isCodeValid = await User.verifyCode(user.email, code);
    if (!isCodeValid) {
      return res.status(400).json({ message: '유효하지 않거나 만료된 코드입니다.' });
    }

    // 인증이 성공하면, 다음 단계(비밀번호 재설정)로 넘어갈 수 있는 상태로 만듦.
    // (예: 세션에 인증 상태 저장 혹은 클라이언트에 토큰 전달 등)
    res.status(200).json({ message: '코드가 성공적으로 확인되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// 비밀번호 재설정
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body; // 인증 상태를 확인하는 추가 로직이 필요

  try {
    // 먼저 이메일로 사용자 인스턴스를 찾음
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 찾은 'user' 인스턴스에 있는 updatePassword 메서드를 호출
    await user.updatePassword(newPassword);
    
    // 비밀번호 재설정 후 인증 코드 초기화
    await User.clearVerificationCode(email);

    res.status(200).json({ message: '비밀번호가 성공적으로 재설정되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
    register,
    login,
    getProfile,
    transporter,
    forgotPassword,
    verifyCode,
    resetPassword
}
