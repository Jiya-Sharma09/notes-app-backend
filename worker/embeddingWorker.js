const { Worker } = require("bullmq");
const connection = require("../queue/redis");
const prisma = require("../prisma/client");

const { chunkText } = require("../RAG/chunker");
const { generateEmbedding } = require("../RAG/generateEmbedding");
const {
    deleteNoteEmbeddings,
    storeEmbedding,
} = require("../RAG/storeEmbedding");

const embeddingWorker = new Worker(
    "note-embedding",
    async (job) => {
        const { noteId, userId } = job.data;

        const note = await prisma.note.findFirst({
            where: {
                id: noteId,
                userId,
            },
            select: {
                id: true,
                userId: true,
                content: true,
            },
        });

        if (!note) {
            throw new Error(`Note ${noteId} not found for user ${userId}.`);
        }

        // Remove the previous vector representation before storing the new one.
        // For a later production version, you can move to versioned embeddings
        // so old vectors remain available until the new set succeeds.
        await deleteNoteEmbeddings(note.id);

        const chunks = chunkText(note.content);

        for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i]);

            await storeEmbedding({
                noteId: note.id,
                userId: note.userId,
                chunkText: chunks[i],
                embedding,
                chunkIndex: i,
            });
        }

        return {
            noteId: note.id,
            chunksCreated: chunks.length,
        };
    },
    {
        connection,
        concurrency: 2,
    }
);

embeddingWorker.on("completed", (job, result) => {
    console.log(
        `Embedding job ${job.id} completed:`,
        result
    );
});

embeddingWorker.on("failed", (job, error) => {
    console.error(
        `Embedding job ${job?.id} failed:`,
        error.message
    );
});

module.exports = { embeddingWorker };
