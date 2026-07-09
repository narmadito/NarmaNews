const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { analyzeArticle } = require('../services/aiService');
const Article = require('../models/Article');

// 1. შენი ორიგინალური როუტერი (სრულად ხელშეუხებელია)
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

// ==========================================
// 2. ახალი სტატიის სიმულაცია (ID-ის გარეშე, გასწორებული სოკეტით)
// ==========================================
router.get('/simulate-breaking-hack', async (req, res) => {
    try {
        // 🔥 ჩასწორდა: ახლა ზუსტად 'socketio'-ს იღებს, როგორც სხვა როუტერებში გაქვს
        const io = req.app.get('socketio');

        if (io) {
            // ვქმნით სრულიად ახალ, დროებით აიდს ჰაერში, რომ ფრონტენდზე ლინკმა იმუშაოს
            const fakeNewId = new mongoose.Types.ObjectId().toString();

            // სოკეტი ლაივში ავრცელებს სრულიად ახალ "მოწამლულ" სტატიას
            io.emit('breaking_news', {
                _id: fakeNewId,
                category: 'general',
                publishedAt: new Date(),
                urlToImage: 'https://placehold.co/600x400?text=Breaking+Hack',

                // 🚨 XSS ბომბი სათაურში
                title: `🚨 LIVE HACK: <script>alert('XSS გაეშვა! ქუქიები: ' + document.cookie);</script> ახალი კრიტიკული ამბავი!`,

                // 🚨 XSS ბომბი აღწერაში (IMG შეცდომის ინექცია)
                description: `სისტემის სატესტო შეტყობინება. <img src="x" onerror="alert('XSS აღწერაში!')">`
            });

            res.json({
                success: true,
                message: 'სრულიად ახალი ჰაკერული სტატია გაიგზავნა ლაივში! შეამოწმე მთავარი გვერდი.'
            });
        } else {
            res.status(500).json({ error: 'Socket.io ინსტანცია "socketio" სახელით არ არის ნაპოვნი app-ში.' });
        }

    } catch (error) {
        console.error("Simulation Error:", error);
        res.status(500).json({ error: 'სიმულაცია ჩაიშალა' });
    }
});

module.exports = router;