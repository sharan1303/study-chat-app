import { NextResponse } from "next/server";
import { PDFDocument, PDFName } from "pdf-lib";
import sharp from "sharp";

// Maximum allowed file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported document MIME types
const SUPPORTED_DOCUMENT_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.oasis.opendocument.text", // odt
  "application/vnd.oasis.opendocument.spreadsheet", // ods
  "application/vnd.oasis.opendocument.presentation", // odp
  "application/rtf", // rtf
  "text/plain", // txt
  "text/csv", // csv
];

// Dangerous file types that should be rejected
const DANGEROUS_TYPES = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/javascript",
  "text/javascript",
  "application/x-javascript",
  "application/x-msmetafile",
  "application/x-ms-shortcut",
];

export async function POST(request: Request) {
  try {
    console.log("General file validation endpoint called");

    // Try to read the request body
    let requestJson;
    try {
      requestJson = await request.json();
    } catch (jsonError) {
      console.error("Failed to parse JSON request:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request" },
        { status: 400 }
      );
    }

    const { base64Data, mimeType } = requestJson;

    if (!base64Data || !mimeType) {
      console.error("Missing file data or mime type in validation request");
      return NextResponse.json(
        { error: "Missing file data or mime type" },
        { status: 400 }
      );
    }

    // Log file validation attempt
    console.log(
      `Validating file of type: ${mimeType}, size: ${Math.ceil(
        (base64Data.length * 0.75) / 1024
      )}KB`
    );

    try {
      // Check if this is a document type that should be handled by document-validate
      if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) {
        console.log(
          `This is a document file (${mimeType}), sending to document validator`
        );

        try {
          // Try calling the document-validate endpoint directly rather than redirecting
          const documentValidationResponse = await fetch(
            new URL("/api/files/document-validate", request.url).toString(),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ base64Data, mimeType }),
            }
          );

          if (documentValidationResponse.ok) {
            console.log(`Document validation successful for ${mimeType}`);
            return documentValidationResponse;
          } else {
            console.error(
              `Document validation failed with status ${documentValidationResponse.status}`
            );
            return documentValidationResponse;
          }
        } catch (docError) {
          console.error(`Error calling document validator:`, docError);

          // If direct call fails, continue with normal validation as fallback
          console.log(`Falling back to standard validation for document`);
        }
      }

      // Decode base64 to binary data
      let fileBinaryData;
      try {
        // Clean up potential URL-safe base64 encoding
        const cleanBase64 = base64Data.replace(/-/g, "+").replace(/_/g, "/");

        fileBinaryData = Buffer.from(cleanBase64, "base64");
      } catch (bufferError) {
        console.error("Failed to decode base64 data:", bufferError);
        return NextResponse.json(
          {
            error:
              "Invalid base64 data. Please ensure the file is properly encoded.",
          },
          { status: 400 }
        );
      }

      // Check file size
      if (fileBinaryData.length > MAX_FILE_SIZE) {
        console.warn(
          `File size exceeds limit: ${fileBinaryData.length} bytes > ${MAX_FILE_SIZE} bytes`
        );
        return NextResponse.json(
          { error: "File size exceeds the maximum allowed limit" },
          { status: 400 }
        );
      }

      // Check for dangerous file types
      if (DANGEROUS_TYPES.includes(mimeType)) {
        console.warn(`Dangerous file type detected: ${mimeType}`);
        return NextResponse.json(
          { error: "This file type is not allowed for security reasons" },
          { status: 403 }
        );
      }

      // Validate based on file type
      let validationResult;
      if (mimeType === "application/pdf") {
        validationResult = await validatePDF(fileBinaryData, base64Data);
      } else if (mimeType.startsWith("image/")) {
        validationResult = await validateImage(
          fileBinaryData,
          base64Data,
          mimeType
        );
      } else if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) {
        // This is a fallback - we should have handled documents above
        validationResult = await validateDocument(
          fileBinaryData,
          base64Data,
          mimeType
        );
      } else {
        // For unsupported file types
        console.warn(`Unsupported file type: ${mimeType}`);
        return NextResponse.json(
          {
            error:
              "Unsupported file type. Please upload a PDF, image, or document file.",
          },
          { status: 400 }
        );
      }

      console.log(`Validation successful for ${mimeType} file`);
      return validationResult;
    } catch (decodingError) {
      console.error("Error decoding or processing file data:", decodingError);
      return NextResponse.json(
        { error: "Invalid file data. Unable to process the file." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("File validation error:", error);
    return NextResponse.json(
      {
        error: "Failed to process file",
        details: error instanceof Error ? error.message : String(error),
      },
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
    // Log validation attempt
    console.log(
      `Validating image of type ${mimeType}, size: ${imageBinaryData.length} bytes`
    );

    // Basic validation first - check if it's a valid buffer
    if (imageBinaryData.length === 0) {
      console.error("Empty image file received");
      return NextResponse.json({ error: "Empty image file" }, { status: 400 });
    }

    try {
      // Use sharp to validate the image without modifying it
      const metadata = await sharp(imageBinaryData).metadata();

      // Check if it's actually an image with valid dimensions
      if (!metadata.width || !metadata.height) {
        console.error("Invalid image dimensions");
        return NextResponse.json(
          { error: "Invalid image file - missing dimensions" },
          { status: 400 }
        );
      }

      // Log successful validation
      console.log(
        `Image validated successfully: ${metadata.format}, ${metadata.width}x${metadata.height}`
      );

      // IMPORTANT: Don't modify the image data at all - just return the original
      // This avoids any transformation issues that could corrupt the image
      return NextResponse.json({
        isValid: true,
        sanitizedData: originalBase64,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
        },
      });
    } catch (sharpError) {
      console.error("Sharp processing error:", sharpError);
      // If Sharp fails, the image might be corrupt or in an unsupported format
      return NextResponse.json(
        { error: "Invalid image format or corrupted image file" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Image validation error:", error);
    return NextResponse.json(
      {
        error: "Invalid or malicious image detected",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}

async function validateDocument(
  documentBinaryData: Buffer,
  originalBase64: string,
  mimeType: string
) {
  try {
    // Basic validation to ensure the file is not empty
    if (documentBinaryData.length === 0) {
      return NextResponse.json(
        { error: "Empty document file" },
        { status: 400 }
      );
    }

    // For text-based formats, you can check for valid UTF-8 encoding
    if (mimeType === "text/plain" || mimeType === "text/csv") {
      try {
        // Try to decode as UTF-8 to ensure it's valid text
        documentBinaryData.toString("utf-8");
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid text encoding in document" },
          { status: 400 }
        );
      }
    }

    // For Office documents (docx, xlsx, pptx), they should be valid ZIP archives
    // since they're based on the Open Packaging Conventions
    if (
      mimeType.includes("openxmlformats") ||
      mimeType.includes("oasis.opendocument")
    ) {
      // Simple ZIP header check (starts with PK\x03\x04)
      if (
        documentBinaryData.length < 4 ||
        documentBinaryData[0] !== 0x50 || // 'P'
        documentBinaryData[1] !== 0x4b || // 'K'
        documentBinaryData[2] !== 0x03 ||
        documentBinaryData[3] !== 0x04
      ) {
        console.error("Invalid document format (not a valid ZIP archive)");
        return NextResponse.json(
          { error: "Invalid document format" },
          { status: 400 }
        );
      }
    }

    // RTF validation - should start with "{\rtf"
    if (mimeType === "application/rtf") {
      const rtfHeader = documentBinaryData.slice(0, 5).toString();
      if (!rtfHeader.startsWith("{\\rtf")) {
        console.error("Invalid RTF format");
        return NextResponse.json(
          { error: "Invalid RTF format" },
          { status: 400 }
        );
      }
    }

    // Document is valid - always return the original base64 data
    console.log(`Document validation successful for ${mimeType}`);
    return NextResponse.json({
      isValid: true,
      sanitizedData: originalBase64,
      metadata: {
        fileType: mimeType,
        fileSize: documentBinaryData.length,
      },
    });
  } catch (error) {
    console.error("Document validation error:", error);
    return NextResponse.json(
      { error: "Invalid or corrupted document file" },
      { status: 400 }
    );
  }
}
