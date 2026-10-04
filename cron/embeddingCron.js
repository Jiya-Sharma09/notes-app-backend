const cron = require("node-cron");

const prisma = require("../prisma/client");
const { chunkText } = require("../ai-rag/chunker");
const { generateEmbedding } = require("../ai-rag/generateEmbedding");
const { replaceNoteEmbeddings } = require("../ai-rag/storeEmbedding");

async function processNote(note) {
    try {
        // Mark note as currently being processed
        await prisma.note.update({
            where: { id: note.id },
            data: {
                embeddingStatus: "PROCESSING",
                embeddingError: null,
            },
        });

        // Split note content into chunks
        const chunks = chunkText(note.content);

        if (chunks.length === 0) {
            throw new Error("Note has no content to embed.");
        }

        // Generate ALL new embeddings first
        const embeddings = [];

        for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i]);

            embeddings.push({
                chunkText: chunks[i],
                embedding,
                chunkIndex: i,
            });
        }

        // Only now replace the old embeddings
        await replaceNoteEmbeddings({
            noteId: note.id,
            userId: note.userId,
            embeddings,
        });

        // Mark as completed
        await prisma.note.update({
            where: { id: note.id },
            data: {
                embeddingStatus: "COMPLETED",
                embeddingError: null,
            },
        });

        console.log(`Embedding completed for note ${note.id}`);
    } catch (error) {
        console.error(`Embedding failed for note ${note.id}:`, error);

        await prisma.note.update({
            where: { id: note.id },
            data: {
                embeddingStatus: "FAILED",
                embeddingError: error.message,
            },
        });
    }
}

async function processPendingNotes() {
    const notes = await prisma.note.findMany({
        where: {
            embeddingStatus: {
                in: ["PENDING", "FAILED"],
            },
        },
        take: 5,
        orderBy: {
            createdAt: "asc",
        },
    });

    for (const note of notes) {
        await processNote(note);
    }
}

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
    console.log("Embedding cron started");

    try {
        await processPendingNotes();
    } catch (error) {
        console.error("Embedding cron failed:", error);
    }
});

module.exports = {
    processPendingNotes,
};