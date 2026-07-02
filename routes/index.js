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
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const categoryQuery = req.query.category || '';
    const searchQuery = req.query.search || '';
    const startIndex = (page - 1) * limit;

    let query = {};
    if (searchQuery) {
      query.title = { $regex: searchQuery, $options: 'i' };
    } else if (categoryQuery) {
      query.category = categoryQuery;
    }

    let totalArticles = await Article.countDocuments(query);

    if (!searchQuery && categoryQuery && totalArticles <= 15) {
      try {
        const apiCategory = categoryQuery === 'sports' ? 'sports' : categoryQuery;
        const apiArticles = await getNewsByCategory(apiCategory);
        await saveArticlesToDB(apiArticles, categoryQuery);
        totalArticles = await Article.countDocuments(query);
      } catch (apiErr) {
        console.error("API Fetch error inside route:", apiErr);
      }
    }

    const paginatedArticles = await Article.find(query)
        .sort({ publishedAt: -1 })
        .skip(startIndex)
        .limit(limit);

    if (searchQuery && paginatedArticles.length === 0) {
      try {
        const apiArticles = await searchNews(searchQuery);
        const saved = await saveArticlesToDB(apiArticles, 'general');
        res.render('index', {
          title: 'NarmaNews',
          articles: saved.slice(0, limit),
          totalArticles: saved.length,
          currentPage: 1,
          totalPages: Math.ceil(saved.length / limit) || 1,
          paginationRange: [1],
          category: '',
          search: searchQuery
        });
        return;
      } catch (searchErr) {
        console.error("Search API error:", searchErr);
      }
    }

    const totalPages = Math.ceil(totalArticles / limit) || 1;

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
      totalArticles: totalArticles,
      currentPage: page,
      totalPages: totalPages,
      paginationRange: paginationRange,
      category: categoryQuery,
      search: searchQuery
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