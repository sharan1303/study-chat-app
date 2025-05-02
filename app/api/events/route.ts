import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ message: "SSE disabled for testing" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
