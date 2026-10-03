const { GoogleGenAI } = require("@google/genai");
const { searchEmbeddingAllNotes } = require("./searchEmbeddingAllNotes");
const { buildContext } = require("./context/buildContext");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const CHAT_MODEL =
    process.env.GEMINI_CHAT_MODEL || "gemini-3.1-flash-lite";

async function chatbotWorkspace({
    question,
    userId,
    history = [],
}) {
    const chunks = await searchEmbeddingAllNotes({
        question,
        userId,
        limit: 5,
    });

    const { historyText, retrievedText } = buildContext({
        history,
        chunks,
    });

    const prompt = `
You are Clarity, an AI assistant for the user's personal knowledge workspace.

Use the retrieved notes to answer the current request.
Only use information supported by the provided notes.
If the answer is not available in the notes, say so clearly.

Recent conversation:
${historyText || "(No previous messages)"}

Relevant notes:
${retrievedText || "(No relevant notes found)"}

Current request:
${question}
`;

    const response = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: prompt,
    });

    return {
        answer: response.text,
        sources: chunks,
    };
}

module.exports = { chatbotWorkspace };
