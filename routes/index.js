const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

const {
  searchNews,
  getNewsByCategory,
  saveArticlesToDB
} = require('../services/newsService');

router.use(async (req, res, next) => {
  try {
    res.locals.tickerArticles = await Article.find().sort({ publishedAt: -1 }).limit(6);
  } catch (error) {
    console.error("Ticker articles fetch error:", error);
    res.locals.tickerArticles = [];
  }
  next();
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us | NarmaNews' });
});

router.get('/privacy-policy', (req, res) => {
  res.render('privacy', { title: 'Privacy Policy | NarmaNews' });
});

router.get('/terms', (req, res) => {
  res.render('terms', { title: 'Terms of Service | NarmaNews' });
});

router.get('/', async (req, res) => {
  try {
    let articles = [];
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const categoryQuery = req.query.category || '';

    if (req.query.search) {
      articles = await Article.find({
        title: { $regex: req.query.search, $options: 'i' }
      }).sort({ publishedAt: -1 });

      if (articles.length === 0) {
        const apiArticles = await searchNews(req.query.search);
        apiArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        articles = await saveArticlesToDB(apiArticles, 'general');
      }

    } else if (categoryQuery) {
      articles = await Article.find({ category: categoryQuery }).sort({ publishedAt: -1 });

      if (articles.length <= 15) {
        const apiCategory = categoryQuery === 'sports' ? 'sports' : categoryQuery;
        const apiArticles = await getNewsByCategory(apiCategory);
        apiArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        await saveArticlesToDB(apiArticles, categoryQuery);
        articles = await Article.find({ category: categoryQuery }).sort({ publishedAt: -1 });
      }

    } else {
      articles = await Article.find().sort({ publishedAt: -1 });
    }

    const totalPages = Math.ceil(articles.length / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);

    let delta = 2;
    let left = page - delta;
    let right = page + delta;
    let range = [];
    let paginationRange = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          paginationRange.push(l + 1);
        } else if (i - l !== 1) {
          paginationRange.push('...');
        }
      }
      paginationRange.push(i);
      l = i;
    }

    res.render('index', {
      title: 'NarmaNews',
      articles: paginatedArticles,
      totalArticles: articles.length,
      currentPage: page,
      totalPages: totalPages,
      paginationRange: paginationRange,
      category: categoryQuery,
      search: req.query.search || ''
    });

  } catch (error) {
    console.error("Main route error:", error);
    res.render('index', {
      title: 'NarmaNews',
      articles: [],
      totalArticles: 0,
      currentPage: 1,
      totalPages: 1,
      paginationRange: [1],
      category: '',
      search: ''
    });
  }
});

module.exports = router;