"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface FileAttachmentProps {
  file: {
    type: string;
    data: string;
    mimeType: string;
    name?: string;
  };
  index: number;
  messageId: string;
}

export default function FileAttachment({
  file,
  index,
  messageId,
}: FileAttachmentProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const fileName = file.name || `attachment-${index}`;

  useEffect(() => {
    setIsValidating(true);
    setValidationError(null);

    console.log(`Starting validation for ${file.mimeType} file ${fileName}`);

    validateFile(file.data, file.mimeType)
      .then(({ sanitizedData, metadata }) => {
        console.log(`Validation successful for ${fileName}`);
        setDataUrl(`data:${file.mimeType};base64,${sanitizedData}`);
        if (metadata) {
          setMetadata(metadata);
          console.log(`Received metadata for ${fileName}:`, metadata);
        }
      })
      .catch((error) => {
        console.error(`File validation error for ${fileName}:`, error);
        setValidationError(error.message || "File validation failed");
        toast.error(
          `File validation failed for ${fileName}: ${
            error.message || "The file may contain malicious content"
          }`
        );
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [file.data, file.mimeType, fileName]);

  // Function to validate any file type on the server
  const validateFile = async (
    base64Data: string,
    mimeType: string
  ): Promise<{ sanitizedData: string; metadata?: any }> => {
    try {
      // Use different endpoint for document types
      const isDocument = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/vnd.oasis.opendocument.presentation",
        "application/rtf",
        "text/plain",
        "text/csv",
      ].includes(mimeType);

      console.log(
        `File type ${mimeType} is ${
          isDocument ? "a document" : "not a document"
        }`
      );

      // Check if the base64Data is valid
      if (!base64Data || typeof base64Data !== "string") {
        console.error(
          `Invalid base64Data for ${mimeType}: ${typeof base64Data}`
        );
        throw new Error("Invalid file data format");
      }

      const endpoint = isDocument
        ? "/api/files/document-validate"
        : "/api/files/validate";

      console.log(`Sending validation request to ${endpoint}`);

      // Add error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      try {
        // Try validation request
        let response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64Data, mimeType }),
          signal: controller.signal,
        }).catch((fetchError) => {
          console.error(`Fetch error for ${endpoint}:`, fetchError);
          throw new Error(`Network error: ${fetchError.message}`);
        });

        clearTimeout(timeoutId);
        console.log(`Got response from ${endpoint}: status ${response.status}`);

        // Handle redirection between validation endpoints
        if (response.status === 307) {
          const redirectInfo = await response.json();
          console.log(`Received redirect info:`, redirectInfo);

          if (redirectInfo.shouldRedirect && redirectInfo.endpoint) {
            console.log(
              `Redirecting to ${redirectInfo.endpoint} for validation`
            );
            // Follow the redirect with a new request
            const redirectController = new AbortController();
            const redirectTimeoutId = setTimeout(
              () => redirectController.abort(),
              10000
            );

            try {
              response = await fetch(redirectInfo.endpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ base64Data, mimeType }),
                signal: redirectController.signal,
              });

              clearTimeout(redirectTimeoutId);
              console.log(
                `Got response from redirect ${redirectInfo.endpoint}: status ${response.status}`
              );
            } catch (redirectError) {
              clearTimeout(redirectTimeoutId);
              console.error(`Error during redirect:`, redirectError);
              throw new Error(
                `Network error on redirect: ${
                  redirectError instanceof Error
                    ? redirectError.message
                    : String(redirectError)
                }`
              );
            }
          }
        }

        if (!response.ok) {
          // Try to parse error response
          try {
            const errorData = await response.json();
            console.error(`Error response from ${endpoint}:`, errorData);
            throw new Error(
              errorData.error || `Server error: ${response.status}`
            );
          } catch (parseError) {
            console.error(`Could not parse error response:`, parseError);
            throw new Error(`Server error: ${response.status}`);
          }
        }

        // Try to parse successful response
        try {
          const result = await response.json();
          console.log(`Validation successful, received result:`, result);

          if (!result.sanitizedData) {
            console.error(`Missing sanitizedData in response:`, result);
            throw new Error("Server returned invalid data format");
          }

          return {
            sanitizedData: result.sanitizedData,
            metadata: result.metadata,
          };
        } catch (parseError) {
          console.error(`Failed to parse JSON response:`, parseError);
          throw new Error("Invalid response format from server");
        }
      } catch (serverError) {
        clearTimeout(timeoutId);
        console.error(`Server validation failed:`, serverError);

        // FALLBACK: If server validation fails, perform basic client-side validation
        console.log(`Falling back to client-side validation`);

        // For simple types like text and images, we can simply return the original data
        // This is safe because we're only displaying the data, not executing it
        if (
          mimeType.startsWith("image/") ||
          mimeType === "text/plain" ||
          mimeType === "text/csv" ||
          mimeType === "application/pdf"
        ) {
          console.log(`Using client-side fallback for ${mimeType}`);

          // Get estimated dimensions for images
          let fileMetadata = {};
          if (mimeType.startsWith("image/")) {
            fileMetadata = {
              width: 500, // Default fallback width
              height: 300, // Default fallback height
            };
          }

          return {
            sanitizedData: base64Data,
            metadata: fileMetadata,
          };
        }

        // For other document types, just try to display them
        if (isDocument) {
          console.log(`Using document fallback for ${mimeType}`);
          return {
            sanitizedData: base64Data,
            metadata: {
              fileType: mimeType,
              fileSize: Math.ceil(base64Data.length * 0.75),
            },
          };
        }

        // Re-throw for unsupported types
        throw serverError;
      }
    } catch (error) {
      console.error(`validateFile catch block:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to validate file");
    }
  };

  // Loading state for all file types
  if (isValidating) {
    return (
      <div className="my-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Validating file for security...
          </p>
        </div>
      </div>
    );
  }

  // Error state for all file types
  if (validationError) {
    return (
      <div className="my-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-red-50 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">
          {validationError}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This file could not be displayed for security reasons.
        </p>
      </div>
    );
  }

  // Only render content if we have a valid data URL
  if (!dataUrl) {
    return null;
  }

  if (file.mimeType.startsWith("image/")) {
    return (
      <div
        className="my-2 rounded-md overflow-hidden file-attachment"
        data-file-name={fileName}
        data-file-type={file.mimeType}
        data-file-size={
          metadata?.fileSize || Math.ceil(file.data.length * 0.75)
        }
      >
        <Image
          src={dataUrl}
          alt={fileName}
          width={metadata?.width || 500}
          height={metadata?.height || 300}
          className="max-w-full h-auto object-contain"
        />
      </div>
    );
  } else if (file.mimeType === "application/pdf") {
    return (
      <div
        className="my-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden file-attachment"
        data-file-name={fileName}
        data-file-type={file.mimeType}
        data-file-size={
          metadata?.fileSize || Math.ceil(file.data.length * 0.75)
        }
      >
        <div className="bg-gray-100 dark:bg-gray-800 py-2 px-3 text-sm font-medium">
          {fileName}
        </div>
        <iframe
          src={dataUrl}
          sandbox="allow-same-origin"
          className="w-full h-[500px] border-0"
          title={fileName}
        />
      </div>
    );
  } else {
    // For other file types, show a download link
    return (
      <div
        className="my-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md file-attachment"
        data-file-name={fileName}
        data-file-type={file.mimeType}
        data-file-size={
          metadata?.fileSize || Math.ceil(file.data.length * 0.75)
        }
      >
        <p className="text-sm mb-2">File: {fileName}</p>
        <a
          href={dataUrl}
          download={fileName}
          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          Download file
        </a>
      </div>
    );
  }
}
