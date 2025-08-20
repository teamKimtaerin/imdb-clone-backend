const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, minlength: 1, maxlength: 20 },
    email: { type: String, unique: true, required: true },
    password: {type: String, required: true, minlength: 6, maxlength: 100},
    nickname: {type: String, required: true, minlength: 4, maxlength: 20},
    profileImage: {type : String, default: 'https://example.com/default-profile.png'},
    preferences: {
        type: [String],
        maxLength : 5,
        default: []
    },
    recentSearches: {
        type: [String],
        maxLength: 10,
        default: []
    },
    isActive: {type: Boolean, default: true},
    lasLoginAt: {type: Date, default: Date.now},

    // 비밀번호 찾기 기능을 위한 필드 추가
    verificationCode: String,
    verificationCodeExpires: Date,
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
})

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
}

userSchema.methods.toJSON = function() {
    const user = this.Object();
    delete user.password;
    return user;
}

// --- 비밀번호 찾기 기능을 위한 정적(Static) 메서드 추가 ---

// 이메일로 사용자 찾기
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email });
};

// 인증 코드와 만료 시간 저장
userSchema.statics.saveVerificationCode = function (email, code) {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1시간 후 만료

    return this.findOneAndUpdate(
        { email },
        {
            verificationCode: code,
            verificationCodeExpires: expires,
        }
    );
};

// 인증 코드 검증
userSchema.statics.verifyCode = async function (email, code) {
    const user = await this.findOne({ email });
    const now = new Date();

    if (user && user.verificationCode === code && user.verificationCodeExpires > now) {
        return true;
    }
    return false;
};

// save()를 호출하여 pre('save') 미들웨어를 통해 비밀번호를 해싱
userSchema.methods.updatePassword = async function (newPassword) {
    this.password = newPassword;
    return this.save();
};

// 인증 코드 초기화
userSchema.statics.clearVerificationCode = function (email) {
    return this.findOneAndUpdate(
        { email },
        { $unset: { verificationCode: "", verificationCodeExpires: "" } }
    );
};

module.exports = mongoose.model('User', userSchema);
