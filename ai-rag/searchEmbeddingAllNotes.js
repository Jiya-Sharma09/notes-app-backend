const { generateEmbedding } = require("./generateEmbedding");
const { searchNotesEmbedding } = require("./searchNotesEmbedding");

async function searchEmbeddingAllNotes({
    question,
    userId,
    limit = 5,
}) {
    const queryEmbedding = await generateEmbedding(question);

    return searchNotesEmbedding({
        userId,
        queryEmbedding,
        limit,
    });
}

module.exports = { searchEmbeddingAllNotes };
