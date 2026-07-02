const axios = require('axios');
const Article = require('../models/Article');

async function getTopHeadlines() {
    try {
        const response = await axios.get(
            `https://newsapi.org/v2/top-headlines?country=us&pageSize=100&apiKey=${process.env.NEWS_API_KEY}`
        );
        return response.data.articles || [];
    } catch (error) {
        console.error("Error fetching top headlines from NewsAPI:", error.message);
        return [];
    }
}

async function searchNews(query) {
    try {
        const response = await axios.get(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=100&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`
        );
        return response.data.articles || [];
    } catch (error) {
        console.error(`Error searching news for query "${query}":`, error.message);
        return [];
    }
}

async function getNewsByCategory(category) {
    try {
        const response = await axios.get(
            `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=100&apiKey=${process.env.NEWS_API_KEY}`
        );
        return response.data.articles || [];
    } catch (error) {
        console.error(`Error fetching news for category "${category}":`, error.message);
        return [];
    }
}

async function saveArticlesToDB(articles, defaultCategory = 'general') {
    if (!Array.isArray(articles) || articles.length === 0) return [];

    try {
        const titles = articles.map(a => a.title).filter(Boolean);

        const existingArticles = await Article.find({ title: { $in: titles } }).select('title');
        const existingTitlesSet = new Set(existingArticles.map(a => a.title));

        const toSave = [];
        for (const article of articles) {
            if (!article.title || existingTitlesSet.has(article.title)) continue;

            toSave.push({
                title: article.title,
                description: article.description,
                content: article.content,
                author: article.author,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: article.source,
                category: defaultCategory
            });
        }

        if (toSave.length > 0) {
            return await Article.insertMany(toSave);
        }

        return [];
    } catch (error) {
        console.error("Bulk save error:", error.message);
        return [];
    }
}
module.exports = {
    getTopHeadlines,
    searchNews,
    getNewsByCategory,
    saveArticlesToDB
};