const Article = require('../models/Article');
const { getTopHeadlines } = require('./newsService');

function detectCategory(title, description) {
    const text = `${title} ${description || ''}`.toLowerCase();

    if (text.includes('sport') || text.includes('football') || text.includes('basketball') || text.includes('match') || text.includes('nba') || text.includes('fifa') || text.includes('athlete')) {
        return 'sports';
    }
    if (text.includes('tech') || text.includes('apple') || text.includes('google') || text.includes('ai') || text.includes('microsoft') || text.includes('software') || text.includes('phone')) {
        return 'technology';
    }
    if (text.includes('health') || text.includes('covid') || text.includes('doctor') || text.includes('medical') || text.includes('virus') || text.includes('cancer')) {
        return 'health';
    }
    if (text.includes('business') || text.includes('finance') || text.includes('stocks') || text.includes('economy') || text.includes('market') || text.includes('crypto')) {
        return 'business';
    }
    if (text.includes('movie') || text.includes('music') || text.includes('hollywood') || text.includes('actor') || text.includes('entertainment') || text.includes('netflix')) {
        return 'entertainment';
    }

    return 'general';
}

async function syncNews() {
    try {
        const articles = await getTopHeadlines();
        if (!Array.isArray(articles)) return;

        for (const article of articles) {
            if (!article.title) continue;

            const exists = await Article.findOne({ title: article.title });

            if (!exists) {
                const category = detectCategory(article.title, article.description);

                await Article.create({
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
            }
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] News synchronization error:`, error.message);
    }
}
module.exports = syncNews;