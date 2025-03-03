import { DynamicTool } from "@langchain/core/tools";

interface PerplexitySearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class PerplexityAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || "";
    if (!this.apiKey) {
      console.warn(
        "Perplexity API key not found. Search functionality will be limited."
      );
    }
  }

  searchTool = new DynamicTool({
    name: "search",
    description: "Search for information on the web using Perplexity Sonar API",
    func: async (query: string) => {
      try {
        if (!this.apiKey) {
          return "Search functionality is currently unavailable. Please try again later.";
        }

        const response = await fetch("https://api.perplexity.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            query,
            max_results: 5,
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`);
        }

        const data = await response.json();

        // Format the search results
        const formattedResults = data.results
          .map((result: PerplexitySearchResult, index: number) => {
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
    },
  });
}
