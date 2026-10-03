const prisma = require("../prisma/client");


async function getAllNoteChunks({ userId, noteId }) {
    return prisma.$queryRaw`
        SELECT
            note_id,
            chunk_text,
            chunk_index
        FROM noteEmbeddings     
        WHERE user_id = ${userId}
          AND note_id = ${noteId}
        ORDER BY chunk_index ASC
    `;
}

module.exports = { getAllNoteChunks };
