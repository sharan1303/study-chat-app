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

  // Pagination parameters
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const cursor = searchParams.get("cursor") || undefined;

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
        `API: Fetching chat history for authenticated user: ${userId}, limit: ${limit}${
          cursor ? `, cursor: ${cursor.substring(0, 8)}...` : ""
        }`
      );
    } else if (sessionId) {
      console.log(
        `API: Fetching chat history for anonymous user with session: ${sessionId.substring(
          0,
          8
        )}..., limit: ${limit}${
          cursor ? `, cursor: ${cursor.substring(0, 8)}...` : ""
        }`
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

    // Fetch chats with pagination
    const chats = await prisma.chat.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      take: limit + 1, // Take one more to check if there are more chats
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1, // Skip the cursor
      }),
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

    // Check if there are more chats
    const hasMore = chats.length > limit;
    const displayChats = hasMore ? chats.slice(0, limit) : chats;

    // Next cursor is the ID of the last chat
    const nextCursor = hasMore
      ? displayChats[displayChats.length - 1].id
      : null;

    // Filter to keep only one "Welcome to Study Chat" entry
    let hasWelcomeChat = false;
    const filteredChats = displayChats.filter((chat) => {
      if (chat.title === "Welcome to Study Chat") {
        if (hasWelcomeChat) {
          return false; // Skip additional welcome chats
        }
        hasWelcomeChat = true;
      }
      return true;
    });

    return Response.json({
      chats: filteredChats,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return new Response("Error fetching chat history", { status: 500 });
  }
}

// Ensure this route is always dynamic
export const dynamic = "force-dynamic";
