const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

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

module.exports = {
    register,
    login,
    getProfile
}
