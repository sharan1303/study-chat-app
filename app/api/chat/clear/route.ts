import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { broadcastChatDeleted } from "@/lib/events";

export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Find the user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Get all chats for this user
    const chats = await prisma.chat.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    // Delete all chats for this user
    await prisma.chat.deleteMany({
      where: { userId: user.id },
    });

    // Broadcast deletion events for each chat
    chats.forEach((chat) => {
      broadcastChatDeleted({ id: chat.id }, [userId]);
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting all chats:", error);
    return new Response("Error deleting all chats", { status: 500 });
  }
}
