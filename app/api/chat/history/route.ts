import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
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
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json(chats);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return new Response("Error fetching chat history", { status: 500 });
  }
}
