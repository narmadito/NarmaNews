const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const User = require('../models/User');

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid Article ID format');
    }

    try {
        const page = parseInt(req.query.commentPage) || 1;
        const limit = 20;

        const article = await Article.findById(id).populate('comments.user');

        if (!article) return res.status(404).send('Article not found');

        const totalComments = article.comments.length;
        const totalPages = Math.ceil(totalComments / limit);
        const startIndex = (page - 1) * limit;
        const paginatedComments = article.comments.slice(startIndex, startIndex + limit);

        let user = null;
        if (req.session && req.session.userId) {
            user = await User.findById(req.session.userId);
        }

        res.render('article', {
            title: article.title,
            article,
            articleId: article._id,
            user,
            comments: paginatedComments,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.error("Fetch article error:", error);
        res.status(500).send('Server Error');
    }
});

router.post('/:id/comment', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const { text } = req.body;
        const currentUser = await User.findById(req.session.userId);

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedArticle = await Article.findByIdAndUpdate(
            id,
            {
                $push: {
                    comments: {
                        user: req.session.userId,
                        text: text
                    }
                }
            },
            { new: true }
        );

        const latestComment = updatedArticle.comments[updatedArticle.comments.length - 1];

        const io = req.app.get('socketio');
        if (io && latestComment) {
            io.to(id).emit('new_comment', {
                commentId: latestComment._id,
                userId: req.session.userId,
                text: text,
                createdAt: latestComment.createdAt,
                user: {
                    username: currentUser.username,
                    profileImage: currentUser.profileImage
                }
            });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Comment Error:", error);
        res.status(500).json({ error: 'Server Error' });
    }
});

router.get('/:id/analyze', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid Article ID format');
    }

    try {
        const article = await Article.findById(id);

        if (!article) {
            return res.status(404).send('Article not found');
        }

        res.render('analyze', {
            title: 'AI Analysis',
            article,
            articleId: article._id
        });

    } catch (error) {
        console.error("Analyze route error:", error);
        res.status(500).send('Server Error');
    }
});

router.post('/:articleId/comment/:commentId/delete', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { articleId, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(articleId) || !mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const article = await Article.findById(articleId);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        const comment = article.comments.id(commentId);

        if (comment && comment.user.toString() === req.session.userId.toString()) {
            comment.deleteOne();
            await article.save();

            const io = req.app.get('socketio');
            if (io) {
                io.to(articleId).emit('delete_comment', { commentId });
            }

            return res.status(200).json({ success: true });
        }

        res.status(403).json({ error: 'Forbidden' });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Server Error' });
    }
});
module.exports = router;