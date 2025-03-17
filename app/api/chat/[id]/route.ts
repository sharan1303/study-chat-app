import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
