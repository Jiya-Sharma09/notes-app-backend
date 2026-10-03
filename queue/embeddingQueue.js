const { Queue } = require("bullmq");
const connection = require("./redis");

const embeddingQueue = new Queue("note-embedding", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

async function queueNoteEmbedding({ noteId, userId }) {
    return embeddingQueue.add("embed-note", {
        noteId,
        userId,
    });
}

module.exports = {
    embeddingQueue,
    queueNoteEmbedding,
};
