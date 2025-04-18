import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import prisma from "./prisma";

export interface RetrievalResult {
  content: string;
  resourceId: string;
  resourceTitle: string;
  score: number;
  metadata: any;
}

/**
 * Get embeddings model
 */
function getEmbeddingsModel() {
  return new GoogleGenerativeAIEmbeddings({
    modelName: "embedding-001",
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

/**
 * Get embedding vector for a query string
 * @param query The query text to embed
 * @returns Float vector representation
 */
export async function getQueryEmbedding(query: string): Promise<number[]> {
  const embeddings = getEmbeddingsModel();
  return embeddings.embedQuery(query);
}

/**
 * Retrieve relevant document chunks for a query
 * @param query User query text
 * @param moduleId Optional module to restrict search to
 * @param limit Maximum number of results to return
 * @returns Array of relevant chunks with metadata
 */
export async function retrieveRelevantChunks(
  query: string,
  moduleId?: string,
  limit: number = 5
): Promise<RetrievalResult[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await getQueryEmbedding(query);

    // Construct the SQL query with optional moduleId filter
    let moduleFilter = "";
    const params: any[] = [queryEmbedding, limit];

    if (moduleId) {
      moduleFilter = `AND r."moduleId" = $3`;
      params.push(moduleId);
    }

    // Perform similarity search
    const results = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        rc."id",
        rc."resourceId",
        rc."content",
        rc."metadata",
        r."title" as "resourceTitle",
        1 - (rc."embedding" <=> $1::vector) as "similarity_score"
      FROM "ResourceChunk" rc
      JOIN "Resource" r ON rc."resourceId" = r."id"
      WHERE 1=1 ${moduleFilter}
      ORDER BY "similarity_score" DESC
      LIMIT $2
    `,
      ...params
    );

    // Format the results
    return results.map((result) => ({
      content: result.content,
      resourceId: result.resourceId,
      resourceTitle: result.resourceTitle,
      score: result.similarity_score,
      metadata: result.metadata,
    }));
  } catch (error) {
    console.error("Error retrieving chunks:", error);
    return [];
  }
}

/**
 * Format retrieved chunks for inclusion in a prompt
 * @param chunks Array of retrieved chunks
 * @returns Formatted context string
 */
export function formatRetrievedContext(chunks: RetrievalResult[]): string {
  if (!chunks || chunks.length === 0) {
    return "";
  }

  const formattedChunks = chunks.map((chunk, index) => {
    return `[${index + 1}] From ${chunk.resourceTitle}:\n${chunk.content}`;
  });

  return `Here is relevant information from your resources:\n\n${formattedChunks.join(
    "\n\n"
  )}`;
}
