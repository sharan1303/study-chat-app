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

    validateFile(file.data, file.mimeType)
      .then(({ sanitizedData, metadata }) => {
        setDataUrl(`data:${file.mimeType};base64,${sanitizedData}`);
        if (metadata) {
          setMetadata(metadata);
        }
      })
      .catch((error) => {
        console.error("File validation error:", error);
        setValidationError(error.message || "File validation failed");
        toast.error(
          `File validation failed: ${
            error.message || "The file may contain malicious content"
          }`
        );
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [file.data, file.mimeType]);

  // Function to validate any file type on the server
  const validateFile = async (
    base64Data: string,
    mimeType: string
  ): Promise<{ sanitizedData: string; metadata?: any }> => {
    try {
      const response = await fetch("/api/files/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base64Data, mimeType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "File validation failed");
      }

      const result = await response.json();
      return {
        sanitizedData: result.sanitizedData,
        metadata: result.metadata,
      };
    } catch (error) {
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
      <div className="my-2 rounded-md overflow-hidden">
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
      <div className="my-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
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
      <div className="my-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
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
