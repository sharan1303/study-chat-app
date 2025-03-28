import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

interface ResourceViewerProps {
  resourceId: string;
  resourceType: string;
  publicUrl: string | null;
  title: string;
}

export function ResourceViewer({
  resourceId,
  resourceType,
  publicUrl,
  title,
}: ResourceViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useUser();

  useEffect(() => {
    const fetchSignedUrl = async () => {
      // Skip if no public URL exists or user is not signed in
      if (!publicUrl || !isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        // Get a signed URL with temporary access from the API
        const response = await axios.get(
          `/api/resources/${resourceId}/secure-url`
        );
        setSignedUrl(response.data.signedUrl);
      } catch (error) {
        console.error("Error fetching signed URL:", error);
        setError("Failed to load resource securely");
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [resourceId, publicUrl, isSignedIn]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-center">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try again or contact support if the problem persists.
        </p>
      </div>
    );
  }

  // If there's no URL at all, show a message
  if (!publicUrl && !signedUrl) {
    return (
      <div className="bg-muted p-4 rounded-md text-center">
        <p className="text-muted-foreground">
          No file available for this resource.
        </p>
      </div>
    );
  }

  // Use the signed URL if available, otherwise fallback to public URL
  const url = signedUrl || publicUrl;

  // Render different viewers based on resource type
  switch (resourceType) {
    case "image":
      return (
        <div className="relative rounded-md overflow-hidden min-h-48">
          <Image
            src={url!}
            alt={title}
            width={800}
            height={600}
            className="object-contain w-full"
          />
        </div>
      );

    case "pdf":
      return (
        <div className="w-full h-96 rounded-md overflow-hidden">
          <iframe
            src={`${url}#toolbar=0`}
            className="w-full h-full"
            title={title}
          />
        </div>
      );

    case "video":
      return (
        <video controls className="w-full rounded-md" src={url!} title={title}>
          Your browser does not support the video tag.
        </video>
      );

    default:
      // For other file types, provide a download link
      return (
        <div className="bg-muted p-4 rounded-md text-center">
          <a
            href={url!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Open {title}
          </a>
        </div>
      );
  }
}
