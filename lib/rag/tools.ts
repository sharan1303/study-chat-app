import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateQueryEmbedding } from "./embeddings";

/**
 * Interface for search results
 */
export interface SearchResult {
  id: string;
  content: string;
  resourceId: string;
  resourceTitle: string;
  resourceType: string;
  similarity: number;
}

/**
 * Search documents for relevant information using vector similarity search
 * @param query Search query
 * @param moduleId Optional module ID to filter results
 * @param limit Maximum number of results to return
 * @returns Array of search results
 */
export async function searchDocuments(
  query: string,
  moduleId?: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // Generate embedding for query
    const embedding = await generateQueryEmbedding(query);

    // Build the where clause for the query
    let whereClause = "";
    const params: any[] = [];

    if (moduleId) {
      whereClause = 'WHERE r."moduleId" = $1 AND';
      params.push(moduleId);
    } else {
      whereClause = "WHERE";
    }

    // Add embedding similarity threshold
    whereClause += ` 1 - (rc."embedding" <=> $${
      params.length + 1
    }::vector) > 0.7`;
    params.push(embedding);

    // Format limit parameter
    params.push(limit);

    // Execute raw SQL query for vector similarity search
    const results = await prisma.$queryRawUnsafe<SearchResult[]>(
      `SELECT 
        rc."id", 
        rc."content", 
        rc."resourceId",
        r."title" as "resourceTitle",
        r."type" as "resourceType",
        1 - (rc."embedding" <=> $${params.length - 1}::vector) as "similarity"
      FROM "ResourceChunk" rc
      JOIN "Resource" r ON rc."resourceId" = r."id"
      ${whereClause}
      ORDER BY similarity DESC
      LIMIT $${params.length}`,
      ...params
    );

    return results;
  } catch (error) {
    console.error("Error searching documents:", error);
    throw new Error(
      `Failed to search documents: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get resource metadata by ID
 * @param resourceId Resource ID
 * @returns Resource metadata or null if not found
 */
export async function getResourceMetadata(resourceId: string) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      title: true,
      type: true,
      fileUrl: true,
      createdAt: true,
      updatedAt: true,
      moduleId: true,
      module: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return resource;
}
