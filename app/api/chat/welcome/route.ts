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
      include: {
        messages: true,
      },
    });

    // If it already exists, just return it
    if (existingChat) {
      return Response.json(existingChat);
    }

    // Create a welcome chat with a fixed ID
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    try {
      // Try to create with the fixed "welcome" ID first
      const chat = await prisma.chat.create({
        data: {
          id: "welcome",
          title: "Welcome to Study Chat",
          sessionId: sessionId,
          createdAt: tenYearsAgo,
          updatedAt: tenYearsAgo,
        },
      });

      // Add welcome messages to the chat
      await prisma.message.createMany({
        data: [
          {
            id: `welcome-prompt-${sessionId}`,
            content: JSON.stringify(WELCOME_PROMPT),
            role: WELCOME_PROMPT.role,
            chatId: chat.id,
            createdAt: tenYearsAgo,
          },
          {
            id: `welcome-response-${sessionId}`,
            content: JSON.stringify(WELCOME_RESPONSE),
            role: WELCOME_RESPONSE.role,
            chatId: chat.id,
            createdAt: new Date(tenYearsAgo.getTime() + 1000), // 1 second after prompt
          },
        ],
      });

      // Fetch messages to include in response
      const messages = await prisma.message.findMany({
        where: { chatId: chat.id },
        orderBy: { createdAt: "asc" },
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

      return Response.json({
        ...chat,
        messages,
      });
    } catch (uniqueError) {
      // If "welcome" ID is already taken, fallback to a session-specific ID
      if (
        uniqueError instanceof Error &&
        uniqueError.message.includes("Unique constraint")
      ) {
        const fallbackId = `welcome-${sessionId.substring(0, 8)}`;

        const fallbackChat = await prisma.chat.create({
          data: {
            id: fallbackId,
            title: "Welcome to Study Chat",
            sessionId: sessionId,
            createdAt: tenYearsAgo,
            updatedAt: tenYearsAgo,
          },
        });

        // Add welcome messages to the chat
        await prisma.message.createMany({
          data: [
            {
              id: `welcome-prompt-fallback-${sessionId}`,
              content: JSON.stringify(WELCOME_PROMPT),
              role: WELCOME_PROMPT.role,
              chatId: fallbackChat.id,
              createdAt: tenYearsAgo,
            },
            {
              id: `welcome-response-fallback-${sessionId}`,
              content: JSON.stringify(WELCOME_RESPONSE),
              role: WELCOME_RESPONSE.role,
              chatId: fallbackChat.id,
              createdAt: new Date(tenYearsAgo.getTime() + 1000), // 1 second after prompt
            },
          ],
        });

        // Fetch messages to include in response
        const messages = await prisma.message.findMany({
          where: { chatId: fallbackChat.id },
          orderBy: { createdAt: "asc" },
        });

        // Broadcast a chat created event for this session
        const chatEventData = {
          id: fallbackChat.id,
          title: fallbackChat.title,
          moduleId: null,
          createdAt: fallbackChat.createdAt,
          updatedAt: fallbackChat.updatedAt,
          sessionId: sessionId,
        };

        if (global.broadcastEvent) {
          global.broadcastEvent("chat.created", chatEventData, [sessionId]);
        }

        return Response.json({
          ...fallbackChat,
          messages,
        });
      }
      throw uniqueError;
    }
  } catch (error) {
    console.error("Error creating welcome chat:", error);
    return new Response("Error creating welcome chat", { status: 500 });
  }
}

// Ensure this route is always dynamic
export const dynamic = "force-dynamic";
