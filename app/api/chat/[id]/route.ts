import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { broadcastChatDeleted } from "@/lib/events";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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

    // Get chat if it exists
    const chat = await prisma.chat.findFirst({
      where: {
        id: params.id,
        userId: user.id,
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

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    return Response.json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    return new Response("Error fetching chat", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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

    // Get chat if it exists
    const chat = await prisma.chat.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    // Delete the chat
    await prisma.chat.delete({
      where: {
        id: params.id,
      },
    });

    // Broadcast the deletion event
    broadcastChatDeleted({ id: params.id }, [userId]);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return new Response("Error deleting chat", { status: 500 });
  }
}
