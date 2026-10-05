function buildContext({ history = [], chunks = [] }) {
    const historyText = history
        .slice(-10)
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n");

    const retrievedText = chunks
        .map(
            (chunk, index) =>
                `[Source ${index + 1} | Note ${chunk.note_id}]\n${chunk.chunk_text}`
        )
        .join("\n\n");

    return {
        historyText,
        retrievedText,
    };
}

module.exports = { buildContext };
