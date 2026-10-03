// IMPORTANT:
// Replace this import with the Prisma singleton already used by your Clarity app.
// Example: const prisma = require("../lib/prisma");

const prisma = require("../prisma/client");

async function deleteNoteEmbeddings(noteId) {
    await prisma.$executeRaw`
        DELETE FROM note_chunks
        WHERE note_id = ${noteId}
    `;
}

async function storeEmbedding({
    noteId,
    userId,
    chunkText,
    embedding,
    chunkIndex,
}) {
    // pgvector accepts its textual vector representation, e.g. [0.1,0.2,...].
    const vector = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
        INSERT INTO note_chunks
            (id, note_id, user_id, chunk_text, embedding, chunk_index)
        VALUES
            (gen_random_uuid(), ${noteId}, ${userId}, ${chunkText},
             ${vector}::vector, ${chunkIndex})
    `;
}

module.exports = {
    deleteNoteEmbeddings,
    storeEmbedding,
};
