import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { broadcastChatDeleted } from "@/lib/events";
import { NextRequest } from "next/server";

type ChatId = {
  id: string;
};

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");

  // Check if either userId or sessionId is provided
  if (!userId && !sessionId) {
    return new Response("Unauthorized - No userId or sessionId provided", {
      status: 401,
    });
  }

  try {
    let chats: ChatId[] = [];

    if (userId) {
      // Authenticated user flow
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return new Response("User not found", { status: 404 });
      }

      // Get all chats for this user
      chats = await prisma.chat.findMany({
        where: { userId: user.id },
        select: { id: true },
      });

      // Delete all chats for this user
      await prisma.chat.deleteMany({
        where: { userId: user.id },
      });
    } else if (sessionId) {
      // Anonymous user flow
      // Get all chats for this session
      chats = await prisma.chat.findMany({
        where: { sessionId },
        select: { id: true },
      });

      // Delete all chats for this session
      await prisma.chat.deleteMany({
        where: { sessionId },
      });
    }

    // Broadcast deletion events for each chat
    const recipientIds = userId ? [userId] : sessionId ? [sessionId] : [];
    chats.forEach((chat) => {
      broadcastChatDeleted({ id: chat.id }, recipientIds);
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting chats:", error);
    return new Response("Error deleting chats", { status: 500 });
  }
}
