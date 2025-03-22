import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log(`Fetching chat history for user: ${userId}`);

    // Find the user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Get all chats for this user
    const chats = await prisma.chat.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        module: {
          select: {
            name: true,
            icon: true,
          },
        },
      },
    });

    console.log(`Found ${chats.length} chats for user ${userId}`);

    return Response.json(chats);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return new Response("Error fetching chat history", { status: 500 });
  }
}

// Ensure this route is always dynamic
export const dynamic = "force-dynamic";
