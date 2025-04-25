import { google } from "@ai-sdk/google";
import { createAzure } from "@ai-sdk/azure";
import { perplexity } from "@ai-sdk/perplexity";
/**
 * Map of supported AI model IDs to their display names
 */
export const SUPPORTED_MODELS = {
  "gemini-2.0-flash": "Gemini 2.0 Flash",
  "gemini-2.5-flash-preview-04-17": "Gemini 2.5 Flash Preview",
  "gpt-4o-mini": "GPT-4o-mini",
  "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
  "sonar-pro": "Perplexity Sonar Pro",
} as const;

/**
 * Type for model IDs based on the SUPPORTED_MODELS keys
 */
export type ModelId = keyof typeof SUPPORTED_MODELS;

/**
 * Type for provider names
 */
export type Provider = "google" | "azure" | "perplexity";

/**
 * Lookup for which provider supports which model ID
 */
export const MODEL_TO_PROVIDER: Record<ModelId, Provider> = {
  "gemini-2.0-flash": "google",
  "gemini-2.5-flash-preview-04-17": "google",
  "gpt-4o-mini": "azure",
  "gemini-2.0-flash-lite": "google",
  "sonar-pro": "perplexity",
};

/**
 * Type for available models in the UI
 */
export interface AvailableModel {
  id: ModelId;
  name: string;
}

/**
 * Array of models available for selection in the UI
 */
export const AVAILABLE_MODELS: AvailableModel[] = Object.entries(
  SUPPORTED_MODELS
).map(([id, name]) => ({
  id: id as ModelId,
  name,
}));

/**
 * Get the default model ID
 */
export function getDefaultModelId(): ModelId {
  return "gemini-2.0-flash";
}

/**
 * Initialize and return an AI model instance based on the provided model ID
 *
 * @param modelId - The ID of the model to initialize
 * @param useWebSearch - Whether to enable web search capabilities
 * @returns The initialized model and its display name
 */
export function getInitializedModel(
  modelId: string,
  useWebSearch: boolean = false
) {
  // Default fallback model
  const defaultModelId = getDefaultModelId();

  // Determine the actual model ID to use (fallback to default if not supported)
  const actualModelId =
    modelId && SUPPORTED_MODELS[modelId as ModelId] ? modelId : defaultModelId;

  // Get the display name or use default
  let modelDisplayName =
    SUPPORTED_MODELS[actualModelId as ModelId] ||
    SUPPORTED_MODELS[defaultModelId];

  let mainModel;

  try {
    // Get provider for this model
    const provider = MODEL_TO_PROVIDER[actualModelId as ModelId];

    if (!provider) {
      throw new Error(`Provider not found for model ${actualModelId}`);
    }

    console.log(`Using ${modelDisplayName} model (${provider})`);

    // Initialize model based on provider
    switch (provider) {
      case "google":
        mainModel = google(actualModelId, {
          useSearchGrounding: useWebSearch,
        });
        break;

      case "azure":
        const azure = createAzure({
          baseURL: process.env.AZURE_BASE_URL,
          apiKey: process.env.AZURE_API_KEY,
          apiVersion: "2023-03-15-preview",
        });
        mainModel = azure(actualModelId);
        break;

      case "perplexity":
        mainModel = perplexity(actualModelId);
        console.log("Perplexity model initialized");
        break;

      default:
        // Should be unreachable due to Provider type constraint
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    // Log error and fall back to default model
    console.error(`Error initializing model ${actualModelId}: ${error}`);
    console.log(`Falling back to default model: ${defaultModelId}`);

    const fallbackProvider = MODEL_TO_PROVIDER[defaultModelId];
    modelDisplayName = SUPPORTED_MODELS[defaultModelId];

    // Initialize fallback model
    switch (fallbackProvider) {
      case "google":
        mainModel = google(defaultModelId, {
          useSearchGrounding: useWebSearch,
        });
        break;
      case "azure":
        const azure = createAzure({
          baseURL: process.env.AZURE_BASE_URL,
          apiKey: process.env.AZURE_API_KEY,
          apiVersion: "2023-03-15-preview",
        });
        mainModel = azure(defaultModelId);
        break;
      default:
        // Fallback failed, hard error
        console.error(`Failed to initialize fallback model ${defaultModelId}`);
        throw new Error(`Could not initialize fallback model.`);
    }
  }

  return { model: mainModel, displayName: modelDisplayName };
}
