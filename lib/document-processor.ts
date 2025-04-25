import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "langchain/document";
import prisma from "./prisma";
import { getSupabaseAdmin } from "./supabase";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { v4 as uuidv4 } from "uuid";

// Map file types to appropriate document loaders
async function extractTextFromFile(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  // Create a temporary file
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `temp_${uuidv4()}`);

  try {
    // Write buffer to temporary file
    fs.writeFileSync(tempFilePath, buffer);

    let text = "";

    // Choose loader based on file type
    if (fileType.includes("pdf")) {
      // Use dynamic import to avoid import errors
      const { PDFLoader } = await import(
        "@langchain/community/document_loaders/fs/pdf"
      );
      const loader = new PDFLoader(tempFilePath);
      const docs = await loader.load();
      text = docs.map((doc: Document) => doc.pageContent).join("\n\n");
    } else if (fileType.includes("word") || fileType.includes("docx")) {
      // Dynamic import DOCX loader
      const { DocxLoader } = await import(
        "@langchain/community/document_loaders/fs/docx"
      );
      const loader = new DocxLoader(tempFilePath);
      const docs = await loader.load();
      text = docs.map((doc: Document) => doc.pageContent).join("\n\n");
    } else if (fileType.includes("text") || fileType.includes("txt")) {
      // Simple text extraction for text files
      text = fs.readFileSync(tempFilePath, "utf8");
    } else {
      // Default: try as plain text
      console.warn(`Unsupported file type: ${fileType}, trying as plain text`);
      text = fs.readFileSync(tempFilePath, "utf8");
    }

    return text;
  } catch (error) {
    console.error(`Error extracting text: ${error}`);
    return "";
  } finally {
    // Clean up temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.warn(`Could not delete temp file ${tempFilePath}: ${error}`);
    }
  }
}

/**
 * Process a resource document by extracting text, chunking, and creating embeddings
 */
export async function processResource(resourceId: string): Promise<boolean> {
  try {
    // Fetch the resource from the database
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || !resource.fileUrl) {
      console.error(`Resource not found or has no file URL: ${resourceId}`);
      return false;
    }

    // Parse the file path from the URL
    const fileUrl = resource.fileUrl;
    const pathMatch = fileUrl.match(/\/resources\/([^?]+)/);

    if (!pathMatch || !pathMatch[1]) {
      console.error(`Could not parse file path from URL: ${fileUrl}`);
      return false;
    }

    const filePath = pathMatch[1];

    // Get the file from Supabase storage
    const supabase = getSupabaseAdmin();
    const { data: fileData, error: fileError } = await supabase.storage
      .from("resources")
      .download(filePath);

    if (fileError || !fileData) {
      console.error(`Error downloading file: ${fileError?.message}`);
      return false;
    }

    // Convert to buffer
    const buffer = await fileData.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Extract text from the file based on its type
    const fileType = resource.type || "text/plain";
    const extractedText = await extractTextFromFile(fileBuffer, fileType);

    if (!extractedText || extractedText.trim().length === 0) {
      console.warn(`No text extracted from resource: ${resourceId}`);
      return false;
    }

    // Split the text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const textChunks = await textSplitter.splitText(extractedText);

    if (textChunks.length === 0) {
      console.warn(`No chunks created for resource: ${resourceId}`);
      return false;
    }

    // Create embeddings for each chunk
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Process chunks in batches to avoid overwhelming the database
    const BATCH_SIZE = 10;
    for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
      const batchChunks = textChunks.slice(i, i + BATCH_SIZE);

      // Generate embeddings for the batch
      const embeddingResults = await embeddings.embedDocuments(batchChunks);

      // Create database records for each chunk with its embedding
      const chunkRecords = batchChunks.map((content, index) => ({
        resourceId,
        content,
        metadata: {
          index: i + index,
          resourceTitle: resource.title,
          resourceType: resource.type,
        },
        embedding: embeddingResults[index],
      }));

      // Insert the chunk records into the database
      for (const record of chunkRecords) {
        await prisma.$executeRaw`
          INSERT INTO "ResourceChunk" ("id", "resourceId", "content", "metadata", "embedding")
          VALUES (
            ${crypto.randomUUID()},
            ${record.resourceId},
            ${record.content},
            ${JSON.stringify(record.metadata)}::jsonb,
            ${record.embedding}::vector
          )
        `;
      }
    }

    console.log(
      `Successfully processed resource: ${resourceId} with ${textChunks.length} chunks`
    );
    return true;
  } catch (error) {
    console.error(`Error processing resource ${resourceId}:`, error);
    return false;
  }
}
