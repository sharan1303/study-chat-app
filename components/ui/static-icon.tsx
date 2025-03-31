/**
 * A server component that renders static SVG icons without requiring client-side functionality.
 * This can be used within loading.tsx files as an alternative to Lucide React icons.
 */

/**
+ * A higher-order component that creates static SVG icons
+ */
function createStaticIcon(paths: React.ReactNode, defaultClassName = "h-4 w-4") {
return function Icon({ className = defaultClassName }: { className?: string }) {
    return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {paths}
        </svg>
    );
  };
}
  
export const UploadIcon = createStaticIcon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </>,
  "h-4 w-4 mr-2"
);

export const SearchIcon = createStaticIcon(
  <>
    <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm8-2a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
    <path d="M21 21l-4.35-4.35" />
  </>,
  "h-4 w-4"
);

export const PlusIcon = createStaticIcon(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
  "h-4 w-4"
);

export const TrashIcon = createStaticIcon(
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </>,
  "h-4 w-4"
);

export const MessageSquareIcon = createStaticIcon(
  <>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </>,
  "h-5 w-5"
);

export const EditIcon = createStaticIcon(
  <>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>,
  "h-5 w-5"
);