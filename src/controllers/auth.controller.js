const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const { validateRegistrationData, validateLoginData, sanitizeInput } = require('../utils/validation');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res) => {
    try {
        const {username, email, password, nickname} = req.body;

        if(!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        const validation = validateRegistrationData({ username, email, password });
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors[0]
            });
        }
        
        // Check if email has been verified
        const verification = await EmailVerification.findOne({ 
            email, 
            isVerified: true 
        });
        
        if (!verification) {
            return res.status(400).json({
                success: false,
                message: 'Email not verified. Please verify your email first.'
            });
        }
        
        const existingUser = await User.findOne({$or: [{email}, {username}]});
    
        if(existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }
        
        const user = new User({
            username,
            nickname: nickname || username, // Use username as default if nickname not provided
            email,
            password,
            isEmailVerified: true // Already verified through the verification flow
        });

        await user.save();

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        user.refreshToken = refreshToken;
        await user.save();
        
        // Clean up verification record
        await EmailVerification.deleteOne({ email });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                accessToken,
                refreshToken,
                user : {
                    id: user._id,
                    username: user.username,
                    nickname: user.nickname,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified
                }
            }
        })
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const validation = validateLoginData({ email, password });
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: validation.errors[0]
        });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          isEmailVerified: user.isEmailVerified
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }
        
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        
        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);
        
        user.refreshToken = newRefreshToken;
        await user.save();
        
        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -refreshToken -emailVerificationCode -emailVerificationExpires');

        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    nickname: user.nickname,
                    email: user.email,
                    isEmailVerified: user.isEmailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const verifyEmailCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and verification code are required'
            });
        }
        
        // First check in temporary verification storage
        const verification = await EmailVerification.findOne({
            email,
            verificationCode: code,
            expiresAt: { $gt: Date.now() }
        });
        
        if (verification) {
            // Mark as verified in temporary storage
            verification.isVerified = true;
            await verification.save();
            
            return res.json({
                success: true,
                message: 'Email verified successfully',
                data: {
                    email: email,
                    verified: true
                }
            });
        }
        
        // Fallback: check existing users (for backward compatibility)
        const user = await User.findOne({
            email,
            emailVerificationCode: code,
            emailVerificationExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }
        
        user.isEmailVerified = true;
        user.emailVerificationCode = null;
        user.emailVerificationExpires = null;
        await user.save();
        
        // Generate tokens for automatic login after verification
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        user.refreshToken = refreshToken;
        await user.save();
        
        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isEmailVerified: true
                }
            }
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }
        
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        user.emailVerificationCode = verificationCode;
        user.emailVerificationExpires = verificationExpires;
        await user.save();
        
        await sendVerificationEmail(email, verificationCode);
        
        res.json({
            success: true,
            message: 'Verification email sent'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Frontend-compatible endpoint for sending verification to unregistered emails
const sendEmailVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        // Generate verification code for new email
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        // Store in temporary verification collection
        await EmailVerification.findOneAndUpdate(
            { email },
            {
                email,
                verificationCode,
                isVerified: false,
                expiresAt
            },
            { upsert: true, new: true }
        );
        
        // Send verification email
        await sendVerificationEmail(email, verificationCode);
        
        res.json({
            success: true,
            message: 'Verification email sent'
        });

    } catch (error) {
        console.error('Send verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send verification email',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const logout = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.refreshToken = null;
            await user.save();
        }
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }
        
        const user = await User.findById(req.user._id);
        
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        user.password = newPassword;
        await user.save();
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const changeEmail = async (req, res) => {
    try {
        const { newEmail, password } = req.body;
        
        if (!newEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'New email and password are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        const user = await User.findById(req.user._id);
        
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }
        
        // Check if new email already exists
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
        
        // Generate verification code for new email
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
        
        // Store verification in temporary collection
        await EmailVerification.findOneAndUpdate(
            { email: newEmail },
            {
                email: newEmail,
                verificationCode,
                isVerified: false,
                expiresAt: verificationExpires
            },
            { upsert: true, new: true }
        );
        
        // Send verification email
        await sendVerificationEmail(newEmail, verificationCode);
        
        res.json({
            success: true,
            message: 'Verification email sent to new address'
        });
        
    } catch (error) {
        console.error('Change email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change email',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const confirmEmailChange = async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and verification code are required'
            });
        }
        
        // Verify code
        const verification = await EmailVerification.findOne({
            email,
            verificationCode: code,
            expiresAt: { $gt: Date.now() }
        });
        
        if (!verification) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }
        
        // Update user email
        const user = await User.findById(req.user._id);
        user.email = email;
        user.isEmailVerified = true;
        await user.save();
        
        // Clean up verification record
        await EmailVerification.deleteOne({ email });
        
        res.json({
            success: true,
            message: 'Email changed successfully',
            data: {
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Confirm email change error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to confirm email change',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });
        }
        
        const user = await User.findById(req.user._id);
        
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }
        
        // Delete user account
        await User.findByIdAndDelete(req.user._id);
        
        // Clean up any verification records
        await EmailVerification.deleteOne({ email: user.email });
        
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


module.exports = {
    register,
    login,
    logout,
    refreshAccessToken,
    getProfile,
    verifyEmailCode,
    resendVerificationEmail,
    sendEmailVerification,
    changePassword,
    changeEmail,
    confirmEmailChange,
    deleteAccount
}
