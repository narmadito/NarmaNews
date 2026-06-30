const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { analyzeArticle } = require('../services/aiService');
const Article = require('../models/Article');

router.get('/analyze/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const article = await Article.findById(id);

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        const analysis = await analyzeArticle(article);
        res.json({ analysis });

    } catch (error) {
        console.error(`AI Analysis Route Error [ID: ${id}]:`, error);
        res.status(500).json({ error: 'AI Analysis Failed' });
    }
});


module.exports = router;