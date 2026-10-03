function chunkText(text, chunkSize = 800, overlap = 150) {
    if (!text || !text.trim()) return [];

    const cleanText = text.trim();
    const chunks = [];

    let start = 0;

    while (start < cleanText.length) {
        let end = Math.min(start + chunkSize, cleanText.length);

        // Prefer ending on whitespace instead of cutting a word.
        if (end < cleanText.length) {
            const lastSpace = cleanText.lastIndexOf(" ", end);
            if (lastSpace > start) end = lastSpace;
        }

        const chunk = cleanText.slice(start, end).trim();

        if (chunk) chunks.push(chunk);

        if (end >= cleanText.length) break;

        // Prevent invalid settings from creating an infinite loop.
        const nextStart = end - overlap;
        start = Math.max(nextStart, start + 1);
    }

    return chunks;
}

module.exports = { chunkText };
