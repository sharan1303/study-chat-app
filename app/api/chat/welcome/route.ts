import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { WELCOME_PROMPT, WELCOME_RESPONSE } from "@/lib/prompts";
import { SESSION_ID_KEY } from "@/lib/session";

export async function POST(request: NextRequest) {
  // Get sessionId from URL parameters
  const searchParams = request.nextUrl.searchParams;
  const sessionIdFromParam = searchParams.get("sessionId");
  const sessionIdFromKey = searchParams.get(SESSION_ID_KEY);
  const sessionId = sessionIdFromParam || sessionIdFromKey;

  if (!sessionId) {
    return new Response("Session ID required", { status: 400 });
  }

  try {
    // Check if a welcome chat already exists for this session
    const existingChat = await prisma.chat.findFirst({
      where: {
        sessionId: sessionId,
        title: "Welcome to Study Chat",
      },
    });

    // If it already exists, just return it
    if (existingChat) {
      return Response.json(existingChat);
    }

    // Create a welcome chat with the session ID
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    const chat = await prisma.chat.create({
      data: {
        id: "welcome-" + sessionId.substring(0, 8),
        title: "Welcome to Study Chat",
        messages: [WELCOME_PROMPT, WELCOME_RESPONSE],
        sessionId: sessionId,
        createdAt: tenYearsAgo,
        updatedAt: tenYearsAgo,
      },
    });

    // Broadcast a chat created event for this session
    const chatEventData = {
      id: chat.id,
      title: chat.title,
      moduleId: null,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      sessionId: sessionId,
    };

    if (global.broadcastEvent) {
      global.broadcastEvent("chat.created", chatEventData, [sessionId]);
    }

    return Response.json(chat);
  } catch (error) {
    console.error("Error creating welcome chat:", error);
    return new Response("Error creating welcome chat", { status: 500 });
  }
}

// Ensure this route is always dynamic
export const dynamic = "force-dynamic";
