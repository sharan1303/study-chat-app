import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { SESSION_ID_KEY } from "@/lib/session";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;

  // Get sessionId from URL - try both parameter names for compatibility
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  // Log authentication information for debugging
  console.log(
    `API: Chat history request - userId: ${userId || "none"}, sessionId: ${
      sessionId ? `${sessionId.substring(0, 8)}...` : "none"
    }`
  );

  // Require either userId or sessionId
  if (!userId && !sessionId) {
    console.error(
      `API: Unauthorized chat history request - no userId or sessionId`
    );
    return new Response("Session ID or authentication required", {
      status: 401,
    });
  }

  try {
    if (userId) {
      console.log(
        `API: Fetching chat history for authenticated user: ${userId}`
      );
    } else if (sessionId) {
      console.log(
        `API: Fetching chat history for anonymous user with session: ${sessionId.substring(
          0,
          8
        )}...`
      );
    }

    // Build where clause based on authentication state
    const where: Prisma.ChatWhereInput = {};
    if (userId) {
      // For authenticated users, find by userId
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return new Response("User not found", { status: 404 });
      }

      where.userId = user.id;
    } else if (sessionId) {
      // For anonymous users, find by sessionId
      where.sessionId = sessionId;
    }

    // Fetch all chats for this user/session
    const chats = await prisma.chat.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    // Filter to keep only one "Welcome to Study Chat" entry
    let hasWelcomeChat = false;
    const filteredChats = chats.filter((chat) => {
      if (chat.title === "Welcome to Study Chat") {
        if (hasWelcomeChat) {
          return false; // Skip additional welcome chats
        }
        hasWelcomeChat = true;
      }
      return true;
    });

    if (userId) {
      console.log(`Found ${chats.length} chats for user ${userId}`);
    } else {
      console.log(
        `Found ${chats.length} chats for anonymous session ${sessionId}`
      );
    }

    return Response.json(filteredChats);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return new Response("Error fetching chat history", { status: 500 });
  }
}

// Ensure this route is always dynamic
export const dynamic = "force-dynamic";
