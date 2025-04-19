import { google } from "@ai-sdk/google";

/**
 * Generates embeddings for an array of text chunks
 * @param texts Array of text chunks to embed
 * @returns Array of objects with text and embedding
 */
export async function generateEmbeddings(texts: string[]) {
  const embedder = google.textEmbeddingModel("text-embedding-004");

  const embeddings = await Promise.all(
    texts.map(async (text) => {
      const embedding = await embedder.doEmbed({ values: [text] });
      return {
        text,
        embedding: embedding.embeddings[0],
      };
    })
  );

  return embeddings;
}

/**
 * Generates embedding for a single query text
 * @param query Text to embed
 * @returns Embedding vector
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const embedder = google.textEmbeddingModel("text-embedding-004");
  const embedding = await embedder.doEmbed({ values: [query] });
  return embedding.embeddings[0];
}

/**
 * Calculate cosine similarity between two vectors
 * @param vecA First vector
 * @param vecB Second vector
 * @returns Similarity score between 0 and 1
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += Math.pow(vecA[i], 2);
    normB += Math.pow(vecB[i], 2);
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
