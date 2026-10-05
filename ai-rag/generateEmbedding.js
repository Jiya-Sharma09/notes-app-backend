const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL =
    process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

async function generateEmbedding(text) {
    if (!text || !text.trim()) {
        throw new Error("Cannot generate an embedding for empty text.");
    }

    const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
    });

    const embedding = response?.embeddings?.[0]?.values;

    if (!embedding?.length) {
        throw new Error("Embedding API returned no vector.");
    }

    return embedding;
}

module.exports = {
    generateEmbedding,
    EMBEDDING_MODEL,
};
