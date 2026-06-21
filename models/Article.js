const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    content: String,
    author: String,
    url: String,
    urlToImage: String,
    publishedAt: Date,
    category: {
        type: String,
        default: 'general',
        lowercase: true
    },
    source: {
        name: String
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    autoIndex: true
});

module.exports = mongoose.model('Article', articleSchema);