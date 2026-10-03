const { generateEmbedding } = require("./generateEmbedding");
const { searchNotesEmbedding } = require("./searchNotesEmbedding");

async function searchEmbeddingOneNote({
    question,
    userId,
    noteId,
    limit = 5,
}) {
    const queryEmbedding = await generateEmbedding(question);

    return searchNotesEmbedding({
        userId,
        noteId,
        queryEmbedding,
        limit,
    });
}

module.exports = { searchEmbeddingOneNote };
