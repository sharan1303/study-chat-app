import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ClientChatPage from "@/app/ClientChatPage";
import { ChatPageLoading } from "@/app/ClientChatPage";
import prisma from "@/lib/prisma";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session.userId;
  const isAuthenticated = !!userId;

  // For unauthenticated users, show the chat UI but with empty history
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<ChatPageLoading />}>
        <ClientChatPage
          initialModuleDetails={null}
          chatId={params.id}
          initialMessages={[]}
          isAuthenticated={false}
        />
      </Suspense>
    );
  }

  // Find the user by Clerk ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return notFound();
  }

  // Check if this chat exists for this user
  const chat = await prisma.chat.findFirst({
    where: {
      id: params.id,
      userId: user.id,
      moduleId: null, // Only for non-module chats
    },
  });

  // Parse messages if chat exists
  const initialMessages = chat?.messages
    ? JSON.parse(JSON.stringify(chat.messages))
    : [];

  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ClientChatPage
        initialModuleDetails={null}
        chatId={params.id}
        initialMessages={initialMessages}
        isAuthenticated={true}
      />
    </Suspense>
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
