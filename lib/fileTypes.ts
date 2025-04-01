/**
 * File type mapping utilities
 *
 * This module provides utilities for mapping file extensions and MIME types
 * to human-readable descriptions, used across the application for consistent
 * file type display.
 */

/**
 * Maps MIME types to human-readable descriptions
 */
export const mimeTypeMap: Record<string, Record<string, string>> = {
  application: {
    pdf: "PDF Document",
    msword: "Word Document",
    "vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Word Document",
    "vnd.ms-excel": "Excel Spreadsheet",
    "vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "Excel Spreadsheet",
    "vnd.ms-powerpoint": "PowerPoint",
    "vnd.openxmlformats-officedocument.presentationml.presentation":
      "PowerPoint",
    zip: "ZIP Archive",
    "x-rar-compressed": "RAR Archive",
    "x-7z-compressed": "7Z Archive",
    "x-tar": "TAR Archive",
    gzip: "GZip Archive",
    json: "JSON File",
    javascript: "Code/JavaScript",
    xml: "XML File",
  },
  image: {
    jpeg: "Image/JPEG",
    png: "Image/PNG",
    gif: "Image/GIF",
    "svg+xml": "Image/SVG",
    webp: "Image/WebP",
    bmp: "Image/BMP",
  },
  video: {
    mp4: "Video/MP4",
    quicktime: "Video/QuickTime",
    "x-msvideo": "Video/AVI",
    webm: "Video/WebM",
  },
  audio: {
    mpeg: "Audio/MP3",
    wav: "Audio/WAV",
    ogg: "Audio/OGG",
    flac: "Audio/FLAC",
    aac: "Audio/AAC",
  },
  text: {
    plain: "Plain Text",
    html: "Code/HTML",
    css: "Code/CSS",
    js: "Code/JavaScript",
    ts: "Code/TypeScript",
    jsx: "Code/JSX",
    tsx: "Code/TSX",
    json: "Code/JSON",
    php: "Code/PHP",
    py: "Code/Python",
    csv: "CSV File",
  },
};

/**
 * Maps file extensions to human-readable descriptions
 */
export const extensionMap: Record<string, string> = {
  // Images
  jpg: "Image/JPEG",
  jpeg: "Image/JPEG",
  png: "Image/PNG",
  gif: "Image/GIF",
  svg: "Image/SVG",
  webp: "Image/WebP",
  bmp: "Image/BMP",

  // Videos
  mp4: "Video/MP4",
  mov: "Video/QuickTime",
  avi: "Video/AVI",
  webm: "Video/WebM",
  mkv: "Video/MKV",

  // Audio
  mp3: "Audio/MP3",
  wav: "Audio/WAV",
  ogg: "Audio/OGG",
  flac: "Audio/FLAC",
  aac: "Audio/AAC",

  // Documents
  pdf: "PDF Document",
  doc: "Word Document",
  docx: "Word Document",
  txt: "Plain Text",
  rtf: "Rich Text Format",
  odt: "OpenDocument Text",

  // Spreadsheets
  xls: "Excel Spreadsheet",
  xlsx: "Excel Spreadsheet",
  csv: "CSV File",
  ods: "OpenDocument Spreadsheet",

  // Presentations
  ppt: "PowerPoint",
  pptx: "PowerPoint",

  // Archives
  zip: "ZIP Archive",
  rar: "RAR Archive",
  "7z": "7Z Archive",
  tar: "TAR Archive",
  gz: "GZip Archive",

  // Code
  html: "Code/HTML",
  css: "Code/CSS",
  js: "Code/JavaScript",
  ts: "Code/TypeScript",
  jsx: "Code/JSX",
  tsx: "Code/TSX",
  json: "Code/JSON",
  php: "Code/PHP",
  py: "Code/Python",
};

/**
 * Gets a human-readable file type description from a file extension
 *
 * @param extension File extension (without the dot)
 * @returns Human-readable file type or the capitalized extension if not found
 */
export function getFileTypeFromExtension(extension: string): string {
  if (!extension) return "Unknown";

  const normalizedExt = extension.toLowerCase();
  return (
    extensionMap[normalizedExt] ||
    extension.charAt(0).toUpperCase() + extension.slice(1)
  );
}

/**
 * Gets a human-readable file type description from a MIME type
 *
 * @param mimeType The MIME type string (e.g., "image/jpeg")
 * @returns Human-readable file type or a formatted version of the MIME type if not found
 */
export function getFileTypeFromMimeType(mimeType: string): string {
  if (!mimeType) return "Unknown";

  const [type, subtype] = mimeType.toLowerCase().split("/");

  if (mimeTypeMap[type]?.[subtype]) {
    return mimeTypeMap[type][subtype];
  }

  // Fallback to capitalized MIME type components
  return `${type.charAt(0).toUpperCase() + type.slice(1)}/${subtype}`;
}

/**
 * Maps a file's type and extension to a base resource type used in the application
 *
 * @param extension File extension or MIME subtype
 * @returns Base resource type (pdf, image, video, etc.)
 */
export function getBaseResourceType(
  extension: string,
  mimeType?: string
): string {
  if (!extension && !mimeType) return "document";

  const ext = extension.toLowerCase();

  // Process by extension
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext))
    return "image";
  if (["mp4", "avi", "mov", "webm", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) return "audio";
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext)) return "document";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "spreadsheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (
    ["html", "css", "js", "ts", "jsx", "tsx", "json", "php", "py"].includes(ext)
  )
    return "code";

  // If no match by extension but we have MIME type, try that
  if (mimeType) {
    const primaryType = mimeType.split("/")[0].toLowerCase();

    if (mimeType.includes("pdf")) return "pdf";
    if (primaryType === "image") return "image";
    if (primaryType === "video") return "video";
    if (primaryType === "audio") return "audio";
    if (
      primaryType === "text" ||
      mimeType.includes("document") ||
      mimeType.includes("msword") ||
      mimeType.includes("wordprocessing")
    )
      return "document";
    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    )
      return "spreadsheet";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("archive") ||
      mimeType.includes("compressed")
    )
      return "archive";
  }

  // Default
  return "document";
}
