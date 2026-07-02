const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    content: String,
    author: String,
    url: String,
    urlToImage: String,
    publishedAt: {
        type: Date,
        index: true
    },
    category: {
        type: String,
        default: 'general',
        lowercase: true,
        index: true
    },
    source: {
        name: String
    },
    reactions: {
        like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        funny: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        sad: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        angry: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
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

articleSchema.index({ category: 1, publishedAt: -1 });

module.exports = mongoose.model('Article', articleSchema);