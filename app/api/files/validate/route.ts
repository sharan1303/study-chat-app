import { NextResponse } from "next/server";
import { PDFDocument, PDFName } from "pdf-lib";
import sharp from "sharp";

// Maximum allowed file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { base64Data, mimeType } = await request.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json(
        { error: "Missing file data or mime type" },
        { status: 400 }
      );
    }

    // Decode base64 to binary data
    const fileBinaryData = Buffer.from(base64Data, "base64");

    // Check file size
    if (fileBinaryData.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the maximum allowed limit" },
        { status: 400 }
      );
    }

    // Validate based on file type
    if (mimeType === "application/pdf") {
      return await validatePDF(fileBinaryData, base64Data);
    } else if (mimeType.startsWith("image/")) {
      return await validateImage(fileBinaryData, base64Data, mimeType);
    } else {
      // For other file types, perform basic validation
      // You could add more specific validation for other types
      return NextResponse.json({
        isValid: true,
        sanitizedData: base64Data,
      });
    }
  } catch (error) {
    console.error("File validation error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}

async function validatePDF(pdfBinaryData: Buffer, originalBase64: string) {
  try {
    // Load and parse the PDF document - will throw if malformed
    const pdfDoc = await PDFDocument.load(pdfBinaryData, {
      updateMetadata: false,
      ignoreEncryption: false,
    });

    // Check for JavaScript (potential security risk)
    const hasJavaScript = pdfDoc.catalog.has(PDFName.of("JavaScript"));
    if (hasJavaScript) {
      return NextResponse.json(
        { error: "PDF contains JavaScript which is not allowed" },
        { status: 403 }
      );
    }

    // Check for embedded files (potential security risk)
    const hasEmbeddedFiles = pdfDoc.catalog.has(PDFName.of("EmbeddedFiles"));
    if (hasEmbeddedFiles) {
      return NextResponse.json(
        { error: "PDF contains embedded files which are not allowed" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isValid: true,
      sanitizedData: originalBase64,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or malicious PDF detected" },
      { status: 400 }
    );
  }
}

async function validateImage(
  imageBinaryData: Buffer,
  originalBase64: string,
  mimeType: string
) {
  try {
    // Use sharp to validate and process the image
    const metadata = await sharp(imageBinaryData).metadata();

    // Check if it's actually an image
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "Invalid image file" },
        { status: 400 }
      );
    }

    // Optionally sanitize the image by re-encoding it
    // This removes any metadata and ensures the image is valid
    const sanitizedImageBuffer = await sharp(imageBinaryData).toBuffer();

    // Convert back to base64
    const sanitizedBase64 = sanitizedImageBuffer.toString("base64");

    return NextResponse.json({
      isValid: true,
      sanitizedData: sanitizedBase64,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or malicious image detected" },
      { status: 400 }
    );
  }
}
