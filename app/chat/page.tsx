import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import ClientChatPage from "@/components/Chat/ClientChatPage";
import { ChatPageLoading } from "@/components/Chat/ChatPageLoading";
import { generateId } from "@/lib/utils";

export default async function NewChat() {
  // Get auth session but don't require authentication
  const session = await auth();
  const userId = session.userId;

  // Generate a new chat ID but don't redirect
  const chatId = generateId();

  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ClientChatPage
        initialModuleDetails={null}
        chatId={chatId}
        initialMessages={[]}
        isAuthenticated={!!userId}
        isNewChat={true}
      />
    </Suspense>
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
