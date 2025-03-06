import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getResources } from "@/app/actions";

// GET /api/resources - Get all resources for the current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resources = await getResources(userId);
    return NextResponse.json(resources);
  } catch (error) {
    console.error("[RESOURCES_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
