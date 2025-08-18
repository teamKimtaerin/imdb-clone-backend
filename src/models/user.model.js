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

userSchema.methods.toJson = function() {
    const user = this.Object();
    delete user.password;
    return user;
}

module.exports = mongoose.model('User', userSchema);
