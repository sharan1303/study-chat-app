/**
 * Splits a text into chunks of roughly targetTokenCount tokens
 * @param text The text to split
 * @param targetTokenCount Target number of tokens per chunk (default: 1000)
 * @param overlap Number of tokens to overlap between chunks (default: 200)
 * @returns Array of text chunks
 */
export function splitIntoChunks(
  text: string,
  targetTokenCount: number = 1000,
  overlap: number = 200
): string[] {
  // Simple estimation: ~4 chars per token for English text
  const targetCharCount = targetTokenCount * 4;
  const overlapCharCount = overlap * 4;

  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (cleanText.length <= targetCharCount) {
    return [cleanText];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    // Calculate end position for this chunk
    let endIndex = startIndex + targetCharCount;

    // Don't go beyond the text length
    if (endIndex >= cleanText.length) {
      endIndex = cleanText.length;
    } else {
      // Try to end at a sentence boundary
      const nextPeriod = cleanText.indexOf(".", endIndex);
      if (nextPeriod !== -1 && nextPeriod < endIndex + 100) {
        endIndex = nextPeriod + 1;
      } else {
        // Or at least at a space
        const nextSpace = cleanText.indexOf(" ", endIndex);
        if (nextSpace !== -1 && nextSpace < endIndex + 20) {
          endIndex = nextSpace;
        }
      }
    }

    // Extract the chunk
    const chunk = cleanText.substring(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    // Move to next chunk with overlap
    startIndex = endIndex - overlapCharCount;
    if (startIndex < 0) startIndex = 0;

    // Break out if we've reached the end
    if (startIndex >= cleanText.length) {
      break;
    }
  }

  return chunks;
}
