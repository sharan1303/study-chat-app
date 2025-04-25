import { Resource } from "@prisma/client";
import prisma from "@/lib/prisma";
import { processDocument } from "./documentProcessor";

/**
 * Process a resource after it has been created or updated
 * @param resourceId ID of the resource to process
 * @returns The processed resource
 */
export async function handleResourceUploaded(
  resourceId: string
): Promise<Resource | null> {
  try {
    // Get the resource from the database
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      console.error(`Resource ${resourceId} not found`);
      return null;
    }

    if (!resource.fileUrl) {
      console.error(`Resource ${resourceId} has no file URL`);
      return null;
    }

    // Process the document
    const processedResource = await processDocument(resource);
    console.log(`Successfully processed resource ${resourceId}`);

    return processedResource;
  } catch (error) {
    console.error(`Error processing resource ${resourceId}:`, error);
    return null;
  }
}
