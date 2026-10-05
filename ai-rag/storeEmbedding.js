const prisma = require("../prisma/client");

async function replaceNoteEmbeddings({
    noteId,
    userId,
    embeddings,
}) {
    await prisma.$transaction(async (tx) => {
        // Delete old embeddings
        await tx.$executeRaw`
            DELETE FROM noteEmbeddings
            WHERE note_id = ${noteId}
              AND user_id = ${userId}
        `;

        // Insert new embeddings
        for (const item of embeddings) {
            const vector = `[${item.embedding.join(",")}]`;

            await tx.$executeRaw`
                INSERT INTO noteEmbeddings
                    (id, note_id, user_id, chunk_text, embedding, chunk_index)
                VALUES
                    (
                        gen_random_uuid(),
                        ${noteId},
                        ${userId},
                        ${item.chunkText},
                        ${vector}::vector,
                        ${item.chunkIndex}
                    )
            `;
        }
    });
}

module.exports = {
    replaceNoteEmbeddings,
};
