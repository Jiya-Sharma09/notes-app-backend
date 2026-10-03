-- Run this SQL against your Neon PostgreSQL database.
-- pgvector must be enabled first.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS noteEmbeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(3072) NOT NULL,
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS noteEmbeddings_note_id_idx
    ON noteEmbeddings(note_id);

CREATE INDEX IF NOT EXISTS noteEmbeddings_user_id_idx
    ON noteEmbeddings(user_id);

-- Add this after you have enough data for the index to be useful.
CREATE INDEX IF NOT EXISTS noteEmbeddings_embedding_idx
    ON noteEmbeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
