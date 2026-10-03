-- Run this SQL against your Neon PostgreSQL database.
-- pgvector must be enabled first.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS note_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(3072) NOT NULL,
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS note_chunks_note_id_idx
    ON note_chunks(note_id);

CREATE INDEX IF NOT EXISTS note_chunks_user_id_idx
    ON note_chunks(user_id);

-- Add this after you have enough data for the index to be useful.
CREATE INDEX IF NOT EXISTS note_chunks_embedding_idx
    ON note_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
