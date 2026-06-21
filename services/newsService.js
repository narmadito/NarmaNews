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
    const savedArticles = [];

    if (!Array.isArray(articles)) return savedArticles;

    try {
        for (const article of articles) {
            if (!article.title) continue;

            let existing = await Article.findOne({ title: article.title });

            if (!existing) {
                existing = await Article.create({
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
            savedArticles.push(existing);
        }
    } catch (error) {
        console.error("Error saving articles to database:", error.message);
    }

    return savedArticles;
}

module.exports = {
    getTopHeadlines,
    searchNews,
    getNewsByCategory,
    saveArticlesToDB
};