/**
 * Minimal RAG helper utilities with pluggable embedding and vector store adapters.
 *
 * Default path:
 * - deterministic in-memory embedding provider
 * - in-memory brute-force cosine similarity store
 *
 * Integrators can swap `VectorStoreAdapter` with Pinecone/Weaviate/PGVector-backed adapters.
 */

export interface RAGDocument {
  id: string;
  text: string;
  metadata?: Record<string, string>;
}

export interface RAGChunk {
  id: string;
  documentId: string;
  text: string;
  metadata?: Record<string, string>;
}

export interface EmbeddedChunk {
  id: string;
  chunk: RAGChunk;
  vector: number[];
}

export interface SimilarityResult {
  chunk: RAGChunk;
  score: number;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}

export interface VectorStoreAdapter {
  upsert(namespace: string, chunks: EmbeddedChunk[]): Promise<void>;
  query(namespace: string, queryVector: number[], topK: number): Promise<SimilarityResult[]>;
  clear?(namespace: string): Promise<void>;
}

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const hashToken = (token: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA <= 0 || normB <= 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Deterministic embedding provider for development.
 * Uses hashed bag-of-words projection into a fixed-size vector.
 */
export class InMemoryEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions: number;

  constructor(dimensions = 96) {
    this.dimensions = clamp(Math.floor(dimensions), 16, 4096);
  }

  async embed(text: string): Promise<number[]> {
    const vector = new Array<number>(this.dimensions).fill(0);
    const tokens = normalizeWhitespace(text.toLowerCase())
      .split(" ")
      .map((token) => token.replace(/[^a-z0-9_-]/g, ""))
      .filter(Boolean);

    if (tokens.length === 0) {
      return vector;
    }

    for (const token of tokens) {
      const hash = hashToken(token);
      const index = hash % this.dimensions;
      const sign = hash % 2 === 0 ? 1 : -1;
      vector[index] += sign * 1;
    }

    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i += 1) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }
}

/**
 * In-memory brute-force vector store adapter.
 */
export class InMemoryVectorStore implements VectorStoreAdapter {
  private readonly namespaces = new Map<string, EmbeddedChunk[]>();

  async upsert(namespace: string, chunks: EmbeddedChunk[]): Promise<void> {
    const existing = this.namespaces.get(namespace) || [];
    const map = new Map(existing.map((entry) => [entry.id, entry]));
    for (const chunk of chunks) {
      map.set(chunk.id, chunk);
    }
    this.namespaces.set(namespace, Array.from(map.values()));
  }

  async query(namespace: string, queryVector: number[], topK: number): Promise<SimilarityResult[]> {
    const entries = this.namespaces.get(namespace) || [];
    const results = entries
      .map((entry) => ({ chunk: entry.chunk, score: cosineSimilarity(queryVector, entry.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, topK));

    return results;
  }

  async clear(namespace: string): Promise<void> {
    this.namespaces.delete(namespace);
  }
}

/**
 * Chunk a document text with configurable overlap.
 */
export const chunkText = (
  text: string,
  options?: { maxChars?: number; overlapChars?: number }
): string[] => {
  const maxChars = clamp(Math.floor(options?.maxChars ?? 420), 80, 4000);
  const overlap = clamp(Math.floor(options?.overlapChars ?? 60), 0, Math.floor(maxChars / 2));

  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const hardEnd = Math.min(normalized.length, start + maxChars);
    let end = hardEnd;

    if (hardEnd < normalized.length) {
      const breakAt = normalized.lastIndexOf(" ", hardEnd);
      if (breakAt > start + 40) {
        end = breakAt;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
};

/**
 * Convert documents into chunk records.
 */
export const buildChunks = (
  docs: RAGDocument[],
  options?: { maxChars?: number; overlapChars?: number }
): RAGChunk[] => {
  const chunks: RAGChunk[] = [];

  for (const doc of docs) {
    const docChunks = chunkText(doc.text, options);
    for (let i = 0; i < docChunks.length; i += 1) {
      chunks.push({
        id: `${doc.id}_chunk_${i + 1}`,
        documentId: doc.id,
        text: docChunks[i],
        metadata: doc.metadata,
      });
    }
  }

  return chunks;
};

/**
 * Ingest document chunks into a vector store namespace.
 */
export const ingestDocuments = async (
  namespace: string,
  docs: RAGDocument[],
  embeddingProvider: EmbeddingProvider,
  vectorStore: VectorStoreAdapter,
  options?: { maxChars?: number; overlapChars?: number }
): Promise<RAGChunk[]> => {
  const chunks = buildChunks(docs, options);
  const embedded: EmbeddedChunk[] = [];

  for (const chunk of chunks) {
    const vector = await embeddingProvider.embed(chunk.text);
    embedded.push({ id: chunk.id, chunk, vector });
  }

  await vectorStore.upsert(namespace, embedded);
  return chunks;
};

/**
 * Retrieve top-K relevant chunks for a query.
 */
export const retrieveRelevant = async (
  namespace: string,
  query: string,
  embeddingProvider: EmbeddingProvider,
  vectorStore: VectorStoreAdapter,
  topK = 4
): Promise<SimilarityResult[]> => {
  const vector = await embeddingProvider.embed(query);
  return vectorStore.query(namespace, vector, Math.max(1, topK));
};
