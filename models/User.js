const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationCode: String,
    verificationExpires: Date,
    profileImage: {
        type: String,
        default: '/uploads/default-avatar.png'
    },
    favorites: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Article'
        }
    ]
}, {
    timestamps: true,
    autoIndex: true
});

module.exports = mongoose.model('User', userSchema);