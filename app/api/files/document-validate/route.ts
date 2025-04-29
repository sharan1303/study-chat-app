import { NextResponse } from "next/server";

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

// Maximum allowed file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    console.log("Document validation endpoint called");

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
      console.error(
        "Missing file data or MIME type in document validation request"
      );
      return NextResponse.json(
        { error: "Missing document data or MIME type" },
        { status: 400 }
      );
    }

    // Log file validation attempt
    console.log(
      `Validating document of type: ${mimeType}, size: ${Math.ceil(
        (base64Data.length * 0.75) / 1024
      )}KB`
    );

    // Check content type early to avoid unnecessary processing
    if (!SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) {
      console.warn(`Unsupported document type: ${mimeType}`);
      return NextResponse.json(
        { error: "Unsupported document type" },
        { status: 400 }
      );
    }

    // For simple text files, we can validate and return quickly
    if (mimeType === "text/plain" || mimeType === "text/csv") {
      // For simple text files, we can return immediately
      console.log(`Document (${mimeType}) validation successful (fast path)`);
      return NextResponse.json({
        isValid: true,
        sanitizedData: base64Data,
        metadata: {
          fileType: mimeType,
          fileSize: Math.ceil(base64Data.length * 0.75),
        },
      });
    }

    try {
      // Decode base64 to binary data
      let documentBinaryData;
      try {
        // Check if base64Data is properly formatted (may have URL-safe formatting)
        const cleanBase64 = base64Data.replace(/-/g, "+").replace(/_/g, "/");

        // Try to decode the potentially cleaned base64 data
        documentBinaryData = Buffer.from(cleanBase64, "base64");

        // Verify that the data is actually valid base64
        const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
        if (
          documentBinaryData.length === 0 ||
          !base64Pattern.test(cleanBase64)
        ) {
          console.error("Base64 data is not properly encoded");
          throw new Error("Invalid base64 encoding");
        }
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
      if (documentBinaryData.length > MAX_FILE_SIZE) {
        console.warn(
          `Document size exceeds limit: ${documentBinaryData.length} bytes > ${MAX_FILE_SIZE} bytes`
        );
        return NextResponse.json(
          { error: "Document size exceeds the maximum allowed limit" },
          { status: 400 }
        );
      }

      // Basic validation to ensure the file is not empty
      if (documentBinaryData.length === 0) {
        console.error("Empty document file received");
        return NextResponse.json(
          { error: "Empty document file" },
          { status: 400 }
        );
      }

      // For text-based formats, check for valid UTF-8 encoding
      if (mimeType === "text/plain" || mimeType === "text/csv") {
        try {
          // Try to decode as UTF-8 to ensure it's valid text
          documentBinaryData.toString("utf-8");
        } catch (e) {
          console.error("Invalid text encoding in document");
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

      // Document is valid - return the original base64 data
      console.log(`Document validation successful for ${mimeType}`);
      const response = {
        isValid: true,
        sanitizedData: base64Data,
        metadata: {
          fileType: mimeType,
          fileSize: documentBinaryData.length,
        },
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("Document data processing error:", error);
      return NextResponse.json(
        {
          error: "Invalid document data. Unable to process the file.",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Document validation error:", error);
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
