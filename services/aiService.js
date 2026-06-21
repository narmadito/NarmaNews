const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function analyzeArticle(article) {
    const prompt = `
Analyze this news article and explain it in very simple English.

Rules:
- Maximum 160 words
- Use easy words that anyone can understand
- Write as one complete paragraph
- Do not split into sections
- Do not use headings
- Do not use bullet points
- Do not use markdown symbols
- Focus only on the most important information
- Explain what happened and why it matters in a simple way

Title:
${article.title ?? 'No title'}

Description:
${article.description ?? 'No description'}

Content:
${article.content ?? 'No content available'}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text || "Failed to generate analysis.";
    } catch (error) {
        console.error("Gemini AI Analysis Service Error:", error);
        return "Failed to generate analysis due to a service error.";
    }
}

module.exports = {
    analyzeArticle
};