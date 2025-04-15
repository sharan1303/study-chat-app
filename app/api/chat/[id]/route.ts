import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { broadcastChatDeleted } from "@/lib/events";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { userId } = await auth();
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!userId && !sessionId) {
    return new Response("Unauthorized - No userId or sessionId provided", {
      status: 401,
    });
  }

  try {
    // Build the where clause based on authentication state
    const whereClause: Prisma.ChatWhereInput = {
      id: params.id,
    };

    // If userId exists, check for both userId and sessionId (if provided)
    if (userId) {
      if (sessionId) {
        whereClause.OR = [{ userId }, { sessionId }];
      } else {
        whereClause.userId = userId;
      }
    } else if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    // Get chat if it exists
    const chat = await prisma.chat.findFirst({
      where: whereClause,
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
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;

    const { userId } = await auth();

    // First try to get sessionId from query parameters
    let sessionId = request.nextUrl.searchParams.get("sessionId");

    // If not found in query params, try to get from cookies
    if (!sessionId) {
      // Get cookie value if present
      const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (cookieValue) {
        sessionId = cookieValue;
      }
    }


    // Check if either userId or sessionId is provided
    if (!userId && !sessionId) {
      return new Response("Unauthorized - No userId or sessionId provided", {
        status: 401,
      });
    }

    // Build where clause for finding the chat
    const chatWhereClause: {
      id: string;
      userId?: string;
      sessionId?: string;
    } = {
      id: params.id,
    };

    if (userId) {
      // For authenticated users
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return new Response("User not found", { status: 404 });
      }

      chatWhereClause.userId = user.id;
    } else if (sessionId) {
      // For anonymous users with session
      chatWhereClause.sessionId = sessionId;
    }

    // Get chat if it exists
    const chat = await prisma.chat.findFirst({
      where: chatWhereClause,
    });

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    try {
      // Delete the chat
      const deleteResult = await prisma.chat.delete({
        where: {
          id: params.id,
        },
      });

      console.log(`Chat deleted successfully: ${JSON.stringify(deleteResult)}`);

      // Broadcast the deletion event
      const recipientId = userId || sessionId;
      if (recipientId) {
        broadcastChatDeleted({ id: params.id }, [recipientId]);
        console.log(`Broadcast deletion event to recipient: ${recipientId}`);
      }

      return new Response(null, { status: 204 });
    } catch (deleteError) {
      if (deleteError instanceof Prisma.PrismaClientKnownRequestError) {
        console.error(
          `Prisma error code: ${deleteError.code}`,
          deleteError.message
        );
        return new Response(`Prisma error: ${deleteError.message}`, {
          status: 500,
        });
      }
      console.error("Error in Prisma delete operation:", deleteError);
      return new Response(
        `Error deleting chat: ${
          deleteError instanceof Error ? deleteError.message : "Unknown error"
        }`,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in DELETE handler:", error);
    return new Response(
      `Error deleting chat: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}
