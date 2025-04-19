import axios from "axios";

/**
 * Type definition for supported file types
 */
export type FileType =
  | "pdf"
  | "docx"
  | "txt"
  | "md"
  | "html"
  | "json"
  | "csv"
  | "unknown";

/**
 * Determines file type from URL or MIME type
 * @param fileUrl URL of the file
 * @param mimeType MIME type of the file (optional)
 * @returns FileType
 */
export function getFileType(fileUrl: string, mimeType?: string): FileType {
  // First check mime type if provided
  if (mimeType) {
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.includes("word") || mimeType.includes("docx")) return "docx";
    if (mimeType.includes("text/plain")) return "txt";
    if (mimeType.includes("text/markdown") || mimeType.includes("md"))
      return "md";
    if (mimeType.includes("html")) return "html";
    if (mimeType.includes("json")) return "json";
    if (mimeType.includes("csv")) return "csv";
  }

  // Then check file extension from URL
  const extension = fileUrl.split(".").pop()?.toLowerCase();
  if (!extension) return "unknown";

  switch (extension) {
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    case "txt":
      return "txt";
    case "md":
    case "markdown":
      return "md";
    case "html":
    case "htm":
      return "html";
    case "json":
      return "json";
    case "csv":
      return "csv";
    default:
      return "unknown";
  }
}

/**
 * Extracts text from a PDF document (placeholder - requires PDF.js or similar)
 * @param buffer PDF file buffer
 * @returns Extracted text
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // In a real implementation, use PDF.js or similar library
  // This is a placeholder that would need actual PDF extraction logic
  console.log("PDF extraction - would normally use PDF.js or similar");
  return "PDF content would be extracted here. This is a placeholder.";
}

/**
 * Extracts text from a DOCX document (placeholder)
 * @param buffer DOCX file buffer
 * @returns Extracted text
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  // In a real implementation, use mammoth.js or similar library
  // This is a placeholder that would need actual DOCX extraction logic
  console.log("DOCX extraction - would normally use mammoth.js or similar");
  return "DOCX content would be extracted here. This is a placeholder.";
}

/**
 * Loads content from a file URL
 * @param fileUrl URL of the file
 * @returns Extracted text content
 */
export async function loadDocumentContent(fileUrl: string): Promise<string> {
  try {
    // Download the file
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(response.data);
    const fileType = getFileType(fileUrl, response.headers["content-type"]);

    // Extract text based on file type
    switch (fileType) {
      case "pdf":
        return await extractTextFromPdf(buffer);
      case "docx":
        return await extractTextFromDocx(buffer);
      case "txt":
      case "md":
        return buffer.toString("utf-8");
      case "html":
        // Simple HTML text extraction (strip tags)
        return buffer.toString("utf-8").replace(/<[^>]*>?/gm, " ");
      case "json":
        // Convert JSON to text representation
        const jsonData = JSON.parse(buffer.toString("utf-8"));
        return JSON.stringify(jsonData, null, 2);
      case "csv":
        // Simple CSV representation
        return buffer.toString("utf-8");
      default:
        // Try to interpret as text
        return buffer.toString("utf-8");
    }
  } catch (error) {
    console.error("Error loading document content:", error);
    throw new Error(
      `Failed to load document content: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
