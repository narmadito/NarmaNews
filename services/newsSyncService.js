const Article = require('../models/Article');
const { getTopHeadlines } = require('./newsService');

function detectCategory(title, description) {
    const text = `${title} ${description || ''}`.toLowerCase();

    if (text.includes('sport') || text.includes('football') || text.includes('basketball') || text.includes('match') || text.includes('nba') || text.includes('fifa') || text.includes('athlete') || text.includes('wimbledon') || text.includes('playoff') || text.includes('cup') || text.includes('tournament') || text.includes('race') || text.includes('olympics')) {
        return 'sports';
    }
    if (text.includes('tech') || text.includes('apple') || text.includes('google') || text.includes('ai') || text.includes('microsoft') || text.includes('software') || text.includes('phone') || text.includes('samsung') || text.includes('hynix') || text.includes('chip') || text.includes('gpu') || text.includes('ryzen') || text.includes('steam') || text.includes('device') || text.includes('cyber') || text.includes('robot')) {
        return 'technology';
    }
    if (text.includes('health') || text.includes('covid') || text.includes('doctor') || text.includes('medical') || text.includes('virus') || text.includes('cancer') || text.includes('measles') || text.includes('vaccine') || text.includes('disease') || text.includes('hospital') || text.includes('gastroenterologist') || text.includes('bidet')) {
        return 'health';
    }
    if (text.includes('business') || text.includes('finance') || text.includes('stocks') || text.includes('economy') || text.includes('market') || text.includes('crypto') || text.includes('comcast') || text.includes('companies') || text.includes('export') || text.includes('trade') || text.includes('investment') || text.includes('bank') || text.includes('oil') || text.includes('prices')) {
        return 'business';
    }
    if (text.includes('movie') || text.includes('music') || text.includes('hollywood') || text.includes('actor') || text.includes('entertainment') || text.includes('netflix') || text.includes('gta') || text.includes('game') || text.includes('supergirl') || text.includes('awards') || text.includes('comedian') || text.includes('humor') || text.includes('show') || text.includes('album') || text.includes('cinema')) {
        return 'entertainment';
    }

    return 'general';
}

async function syncNews(io) {
    try {
        const articles = await getTopHeadlines();
        if (!Array.isArray(articles)) return;

        for (const article of articles) {
            if (!article.title) continue;

            const exists = await Article.findOne({ title: article.title });

            if (!exists) {
                const category = detectCategory(article.title, article.description);

                const newArticle = await Article.create({
                    title: article.title,
                    description: article.description,
                    content: article.content,
                    author: article.author,
                    url: article.url,
                    urlToImage: article.urlToImage,
                    publishedAt: article.publishedAt,
                    source: article.source,
                    category: category
                });

                if (io) {
                    io.emit('breaking_news', {
                        _id: newArticle._id,
                        title: newArticle.title,
                        description: newArticle.description,
                        urlToImage: newArticle.urlToImage,
                        category: newArticle.category,
                        publishedAt: newArticle.publishedAt
                    });
                }
            }
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] News synchronization error:`, error.message);
    }
}

module.exports = syncNews;