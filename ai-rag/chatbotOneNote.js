const { GoogleGenAI } = require("@google/genai");
const { searchEmbeddingOneNote } = require("./searchEmbeddingOneNote");
const { getAllNoteChunks } = require("./getAllNoteChunks");
const { buildContext } = require("./context/buildContext");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const CHAT_MODEL =
    process.env.GEMINI_CHAT_MODEL || "gemini-3.1-flash-lite";

async function chatbotOneNote({
    question,
    userId,
    noteId,
    history = [],
    operation = "question",
}) {
    // A summary needs the whole note, not top-K semantic chunks.
    const chunks =
        operation === "summary"
            ? await getAllNoteChunks({ userId, noteId })
            : await searchEmbeddingOneNote({
                  question,
                  userId,
                  noteId,
                  limit: 5,
              });

    const { historyText, retrievedText } = buildContext({
        history,
        chunks,
    });

    const prompt = `
You are Clarity, an AI assistant for the user's notes.

Use the retrieved note context to answer the user's current request.
Do not invent information that is not supported by the note context.

Recent conversation:
${historyText || "(No previous messages)"}

Note context:
${retrievedText || "(No relevant note context found)"}

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

module.exports = { chatbotOneNote };
