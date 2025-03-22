interface PerplexitySearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface PerplexitySearchResponse {
  results: PerplexitySearchResult[];
}

export async function searchWithPerplexity(query: string): Promise<string> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.warn("Perplexity API key not found");
      return "Search functionality is currently unavailable. Please try again later.";
    }

    const response = await fetch("https://api.perplexity.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn(
          "Perplexity API authentication failed. Please check your API key."
        );
        return "Search is currently unavailable due to authentication issues. The assistant will rely on its existing knowledge.";
      }
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data: PerplexitySearchResponse = await response.json();

    // Format the search results
    const formattedResults = data.results
      .map((result, index) => {
        return `[${index + 1}] ${result.title}\n${result.url}\n${
          result.snippet
        }\n`;
      })
      .join("\n");

    return `Search results for "${query}":\n\n${formattedResults}`;
  } catch (error) {
    console.error("Search error:", error);
    return `Failed to search for "${query}". Error: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
}
