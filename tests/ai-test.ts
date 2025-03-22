import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function testGoogleApiConnection() {
  try {
    console.log("Testing Google API connection...");

    // Use result to confirm successful API connection but don't need to access its value
    await streamText({
      model: google("models/gemini-2.0-flash"),
      messages: [{ role: "user", content: "Hello, this is a test message." }],
      temperature: 0.7,
      maxTokens: 100,
    });

    console.log("Connection successful!");
    return { success: true, message: "Google API connection successful" };
  } catch (error) {
    console.error("Google API connection error:", error);
    return {
      success: false,
      message: "Google API connection failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
