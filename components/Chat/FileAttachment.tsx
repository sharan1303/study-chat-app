"use client";

import React from "react";
import Image from "next/image";

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
  // Create a data URL from the base64 data
  const dataUrl = `data:${file.mimeType};base64,${file.data}`;
  const fileName = file.name || `attachment-${index}`;

  if (file.mimeType.startsWith("image/")) {
    return (
      <div className="my-2 rounded-md overflow-hidden">
        <Image
          src={dataUrl}
          alt={fileName}
          width={500}
          height={300}
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
