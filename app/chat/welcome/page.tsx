import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import ClientChatPage from "@/components/Chat/ClientChatPage";
import { ChatPageLoading } from "@/components/Chat/ChatPageLoading";
import { Message } from "@ai-sdk/react";
import { WELCOME_PROMPT, WELCOME_RESPONSE } from "@/lib/prompts";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { SESSION_ID_KEY } from "@/lib/session";

export default async function WelcomeChat() {
  // Get auth session but don't require authentication
  const session = await auth();
  const userId = session.userId;
  const isAuthenticated = !!userId;

  // For unauthenticated users, get session ID from cookies
  let sessionId = null;
  if (!isAuthenticated) {
    const cookieStore = await cookies();
    sessionId = cookieStore.get(SESSION_ID_KEY)?.value || null;
  }

  // Get or create welcome chat ID
  const chatId = await getOrCreateWelcomeChatId(userId, sessionId);

  // Include the welcome conversation
  const initialMessages: Message[] = [WELCOME_PROMPT, WELCOME_RESPONSE];

  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ClientChatPage
        initialModuleDetails={null}
        chatId={chatId}
        initialMessages={initialMessages}
        isAuthenticated={isAuthenticated}
        initialTitle="Welcome to Study Chat"
        forceOldest={true} // Always force the welcome chat to appear as oldest
      />
    </Suspense>
  );
}

// Helper function to get or create a welcome chat ID
async function getOrCreateWelcomeChatId(
  userId: string | null,
  sessionId: string | null
): Promise<string> {
  // For authenticated users, try to find existing welcome chat
  if (userId) {
    // Check if a welcome chat already exists for this user
    const existingWelcomeChat = await prisma.chat.findFirst({
      where: {
        userId: userId,
        title: "Welcome to Study Chat",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // If there's an existing welcome chat, use its ID
    if (existingWelcomeChat) {
      return existingWelcomeChat.id;
    }

    // If no existing welcome chat, create one with a very old date
    // Use a fixed ID of "welcome" for authenticated users
    const chatId = "welcome";
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    try {
      await prisma.chat.create({
        data: {
          id: chatId,
          title: "Welcome to Study Chat",
          messages: [WELCOME_PROMPT, WELCOME_RESPONSE],
          moduleId: null,
          userId: userId,
          createdAt: tenYearsAgo,
          updatedAt: tenYearsAgo,
        },
      });

      return chatId;
    } catch (error) {
      console.error("Error creating welcome chat:", error);
      return "welcome";
    }
  }

  // For unauthenticated users, try to find existing welcome chat by session ID
  if (sessionId) {
    // Check if a welcome chat already exists for this session
    const existingWelcomeChat = await prisma.chat.findFirst({
      where: {
        sessionId: sessionId,
        title: "Welcome to Study Chat",
      },
    });

    // If there's an existing welcome chat, use its ID
    if (existingWelcomeChat) {
      return existingWelcomeChat.id;
    }

    // If no existing welcome chat, create one with a fixed ID
    const chatId = "welcome";
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    try {
      await prisma.chat.create({
        data: {
          id: chatId,
          title: "Welcome to Study Chat",
          messages: [WELCOME_PROMPT, WELCOME_RESPONSE],
          sessionId: sessionId,
          createdAt: tenYearsAgo,
          updatedAt: tenYearsAgo,
        },
      });

      return chatId;
    } catch (error) {
      console.error("Error creating welcome chat:", error);
      // If there's already a welcome chat with this ID (possible with multiple anonymous users),
      // we need to handle the conflict by using a session-specific ID as fallback
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        console.log("Welcome chat ID collision, using session-specific ID");
        const fallbackId = `welcome-${sessionId.substring(0, 8)}`;
        try {
          await prisma.chat.create({
            data: {
              id: fallbackId,
              title: "Welcome to Study Chat",
              messages: [WELCOME_PROMPT, WELCOME_RESPONSE],
              sessionId: sessionId,
              createdAt: tenYearsAgo,
              updatedAt: tenYearsAgo,
            },
          });
          return fallbackId;
        } catch (innerError) {
          console.error("Error creating fallback welcome chat:", innerError);
        }
      }
      return "welcome";
    }
  }

  // Fallback for edge cases - use a consistent ID
  return "welcome";
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
