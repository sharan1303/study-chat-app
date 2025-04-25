"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  tomorrow,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";

type ExtendedCSSProperties = { [key: string]: string | number | undefined };

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const content = children ? String(children).replace(/\n$/, "") : "";

  const isShellLanguage = [
    "bash",
    "shell",
    "sh",
    "zsh",
    "dos",
    "powershell",
    "cmd",
    "bat",
  ].includes(language);

  // Return a placeholder while theme is loading to prevent flashing
  // Always use code elements for unmounted state to avoid nesting divs in p tags
  if (!isMounted) {
    return (
      <code className="bg-transparent text-transparent" {...props}>
        {content}
      </code>
    );
  }

  if (inline) {
    return (
      <code
        className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 font-mono px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded text-xs"
        style={{ wordBreak: "break-all", whiteSpace: "normal" }}
        {...props}
      >
        {isShellLanguage && <span className="text-gray-400">$</span>}
        {content}
      </code>
    );
  }

  if (language || (className && className.trim() !== "")) {
    return (
      <div
        className={`my-3 overflow-hidden rounded-md w-full max-w-full ${
          isShellLanguage
            ? "shadow-[0_4px_8px_rgba(0,0,0,0.3)] dark:shadow-gray-950/70"
            : "shadow-md"
        }`}
      >
        <div
          className={`flex items-center justify-between ${
            isShellLanguage
              ? "bg-gray-700 text-gray-100 dark:bg-gray-950"
              : "bg-gray-800 text-gray-200 dark:bg-gray-900"
          } px-4 py-2 text-xs`}
        >
          <span>
            {isShellLanguage ? (
              <>
                <span className="mr-1 text-gray-400">$</span>
                {language || "shell"}
              </>
            ) : (
              language || "text"
            )}
          </span>
        </div>
        <SyntaxHighlighter
          language={language || "text"}
          // @ts-expect-error - SyntaxHighlighter style prop type incompatibility
          style={resolvedTheme === "dark" ? tomorrow : oneLight}
          customStyle={
            {
              margin: 0,
              padding: "1rem",
              backgroundColor: resolvedTheme === "dark" ? "#1e293b" : "ffffff",
              borderRadius: "0 0 0.375rem 0.375rem",
              fontSize: "0.875rem",
              lineHeight: "1.5",
              width: "100%",
              maxWidth: "100%",
              overflowX: "auto",
            } as ExtendedCSSProperties
          }
          wrapLongLines={true}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            },
          }}
          PreTag="div"
          {...props}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    );
  }

  // Default case for plain code
  return (
    <code
      className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 font-mono px-1.5 py-0.5 border border-gray-200 dark:border-gray-700 rounded text-xs w-full max-w-full"
      style={{ wordBreak: "break-all", whiteSpace: "normal" }}
      {...props}
    >
      {content}
    </code>
  );
}

export default CodeBlock;
