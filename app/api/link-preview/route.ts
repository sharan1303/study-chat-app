import { NextRequest, NextResponse } from "next/server";

/**
 * This is a simple API endpoint to fetch URL metadata for link previews
 * In a production environment, you'd likely want to:
 * 1. Add caching for performance and to reduce API calls
 * 2. Use a more robust HTML parsing strategy
 * 3. Consider rate limiting and security measures
 * 4. Possibly use a dedicated service like microlink.io
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  // Setup default headers for all responses
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    // Parse URL for fallback information
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const fallbackData = {
      success: false,
      url,
      title: hostname,
      description: "",
      image: "",
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    };

    // Fetch the HTML content of the URL with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort("Request timeout"),
      10000
    ); // Increased to 10 second timeout

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkPreviewBot/1.0)",
        },
        signal: controller.signal,
      });

      // Clear the timeout as soon as the request completes
      clearTimeout(timeoutId);

      // If response is not OK, return fallback data instead of throwing an error
      if (!response.ok) {
        console.warn(`Failed to fetch URL: ${url} (${response.status})`);
        return NextResponse.json(fallbackData, { headers });
      }

      const html = await response.text();

      // Extract metadata
      const title =
        extractMetadata(html, "title") ||
        extractMetadata(html, "og:title") ||
        extractMetadata(html, "twitter:title") ||
        hostname;

      const description =
        extractMetadata(html, "description") ||
        extractMetadata(html, "og:description") ||
        extractMetadata(html, "twitter:description") ||
        "";

      const image =
        extractMetadata(html, "og:image") ||
        extractMetadata(html, "twitter:image") ||
        "";

      const favicon = extractFavicon(html, parsedUrl.origin);

      return NextResponse.json(
        {
          success: true,
          url,
          title,
          description,
          image,
          favicon,
        },
        { headers }
      );
    } catch (fetchError) {
      // Clear timeout to prevent memory leaks
      clearTimeout(timeoutId);

      // Return fallback data for fetch errors
      console.error("Error fetching URL:", fetchError);
      return NextResponse.json(fallbackData, { headers });
    }
  } catch (error) {
    console.error("Error in link preview processing:", error);

    // Parse URL for fallback information (in case of other errors)
    try {
      const parsedUrl = new URL(url);
      return NextResponse.json(
        {
          success: false,
          url,
          title: parsedUrl.hostname,
          description: "",
          image: "",
          favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
        },
        { headers }
      );
    } catch (parseError) {
      // Handle URL parsing errors
      return NextResponse.json(
        {
          success: false,
          url,
          title: url,
          description: "",
          image: "",
          favicon: "",
        },
        { headers }
      );
    }
  }
}

// Helper function to extract metadata from HTML
function extractMetadata(html: string, metaName: string): string | null {
  try {
    // Check for Open Graph and Twitter metadata
    if (metaName.startsWith("og:") || metaName.startsWith("twitter:")) {
      const match =
        new RegExp(
          `<meta\\s+property=["']${metaName}["']\\s+content=["']([^"']*)["']`,
          "i"
        ).exec(html) ||
        new RegExp(
          `<meta\\s+name=["']${metaName}["']\\s+content=["']([^"']*)["']`,
          "i"
        ).exec(html) ||
        new RegExp(
          `<meta\\s+content=["']([^"']*)["']\\s+property=["']${metaName}["']`,
          "i"
        ).exec(html) ||
        new RegExp(
          `<meta\\s+content=["']([^"']*)["']\\s+name=["']${metaName}["']`,
          "i"
        ).exec(html);
      return match ? match[1] : null;
    }

    // Check for regular metadata or title
    if (metaName === "title") {
      const match = /<title>([^<]*)<\/title>/i.exec(html);
      return match ? match[1].trim() : null;
    } else {
      const match =
        new RegExp(
          `<meta\\s+name=["']${metaName}["']\\s+content=["']([^"']*)["']`,
          "i"
        ).exec(html) ||
        new RegExp(
          `<meta\\s+content=["']([^"']*)["']\\s+name=["']${metaName}["']`,
          "i"
        ).exec(html);
      return match ? match[1] : null;
    }
  } catch (e) {
    console.error("Error extracting metadata:", e);
    return null;
  }
}

// Helper function to extract favicon
function extractFavicon(html: string, baseUrl: string): string {
  try {
    // Try to find favicon link in the HTML
    const match =
      /<link\s+rel=["'](?:shortcut )?icon["']\s+href=["']([^"']*)["']/i.exec(
        html
      ) ||
      /<link\s+href=["']([^"']*)["']\s+rel=["'](?:shortcut )?icon["']/i.exec(
        html
      );

    if (match && match[1]) {
      const favicon = match[1];
      // Handle relative URLs
      if (favicon.startsWith("/")) {
        return `${baseUrl}${favicon}`;
      } else if (!favicon.startsWith("http")) {
        return `${baseUrl}/${favicon}`;
      }
      return favicon;
    }
  } catch (e) {
    console.error("Error extracting favicon:", e);
  }

  // Fall back to Google's favicon service
  return `https://www.google.com/s2/favicons?domain=${baseUrl}&sz=64`;
}
