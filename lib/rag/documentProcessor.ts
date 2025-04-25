import { Resource, ResourceChunk } from "@prisma/client";
import prisma from "@/lib/prisma";
import { loadDocumentContent } from "./documentLoader";
import { splitIntoChunks } from "./chunking";
import { generateEmbeddings } from "./embeddings";

/**
 * Type for embedded chunks with text and embedding vector
 */
type EmbeddedChunk = {
  text: string;
  embedding: number[];
};

/**
 * Process a document by extracting text, chunking, generating embeddings, and storing in the database
 * @param resource The resource to process
 * @returns The processed resource with chunks
 */
export async function processDocument(resource: Resource): Promise<Resource> {
  if (!resource.fileUrl) {
    throw new Error("Resource has no file URL");
  }

  try {
    // 1. Load document content
    const content = await loadDocumentContent(resource.fileUrl);

    // 2. Split into chunks
    const chunks = splitIntoChunks(content);

    // 3. Generate embeddings
    const embeddedChunks = await generateEmbeddings(chunks);

    // 4. Store in database
    await storeChunks(resource.id, embeddedChunks);

    // 5. Mark resource as processed
    return await prisma.resource.update({
      where: { id: resource.id },
      include: { chunks: true },
      data: {
        // Store the embedding of the first chunk as the resource embedding
        // This provides a rough representation of the whole document
        embedding:
          embeddedChunks.length > 0 ? embeddedChunks[0].embedding : undefined,
      },
    });
  } catch (error) {
    console.error(`Error processing document ${resource.id}:`, error);
    throw new Error(
      `Failed to process document: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Store document chunks and their embeddings in the database
 * @param resourceId ID of the resource
 * @param chunks Array of text chunks with embeddings
 */
async function storeChunks(
  resourceId: string,
  chunks: EmbeddedChunk[]
): Promise<ResourceChunk[]> {
  // Delete any existing chunks for this resource
  await prisma.resourceChunk.deleteMany({
    where: { resourceId },
  });

  // Create new chunks
  return await prisma.$transaction(
    chunks.map((chunk, index) =>
      prisma.resourceChunk.create({
        data: {
          resourceId,
          content: chunk.text,
          embedding: chunk.embedding,
          metadata: {
            index,
            length: chunk.text.length,
          },
        },
      })
    )
  );
}

/**
 * Process all unprocessed resources in the database
 * @returns Number of processed resources
 */
export async function processAllUnprocessedResources(): Promise<number> {
  const resources = await prisma.resource.findMany({
    where: {
      fileUrl: { not: null },
      embedding: null,
    },
  });

  let processedCount = 0;

  for (const resource of resources) {
    try {
      await processDocument(resource);
      processedCount++;
    } catch (error) {
      console.error(`Failed to process resource ${resource.id}:`, error);
    }
  }

  return processedCount;
}
