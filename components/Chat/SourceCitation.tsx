import React from "react";
import { HelpCircle, FileText } from "lucide-react";
import Link from "next/link";

interface SourceCitationProps {
  sources: {
    resourceId: string;
    resourceTitle: string;
    snippet?: string;
  }[];
  compact?: boolean;
}

export function SourceCitation({
  sources,
  compact = false,
}: SourceCitationProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      {!compact && (
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <HelpCircle className="h-4 w-4 mr-2" />
          <span>Sources from your resources:</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <Link
            key={source.resourceId}
            href={`/resources/${source.resourceId}`}
            className="inline-flex items-center gap-1.5 text-xs rounded-full bg-secondary px-3 py-1 hover:bg-secondary/70 transition-colors"
          >
            <FileText className="h-3 w-3" />
            <span>{source.resourceTitle}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
