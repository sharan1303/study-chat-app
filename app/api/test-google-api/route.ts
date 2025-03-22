import { testGoogleApiConnection } from "@/tests/ai-test";

export async function GET() {
  try {
    const result = await testGoogleApiConnection();

    return Response.json(result);
  } catch (error) {
    console.error("Error in test route:", error);
    return Response.json(
      {
        success: false,
        message: "Test failed with an unexpected error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
