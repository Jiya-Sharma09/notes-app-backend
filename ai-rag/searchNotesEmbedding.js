const prisma = require("../prisma/client");

/**
 * General vector-search function.
 *
 * noteId:
 *   supplied -> search inside one note
 *   omitted  -> search across the user's notes
 */
async function searchNotesEmbedding({
    userId,
    queryEmbedding,
    noteId = null,
    limit = 5,
}) {
    const vector = `[${queryEmbedding.join(",")}]`;

    if (noteId) {
        return prisma.$queryRaw`
            SELECT
                note_id,
                chunk_text,
                chunk_index,
                embedding <=> ${vector}::vector AS distance
            FROM note_chunks
            WHERE user_id = ${userId}
              AND note_id = ${noteId}
            ORDER BY embedding <=> ${vector}::vector
            LIMIT ${limit}
        `;
    }

    return prisma.$queryRaw`
        SELECT
            note_id,
            chunk_text,
            chunk_index,
            embedding <=> ${vector}::vector AS distance
        FROM note_chunks
        WHERE user_id = ${userId}
        ORDER BY embedding <=> ${vector}::vector
        LIMIT ${limit}
    `;
}

module.exports = { searchNotesEmbedding };
