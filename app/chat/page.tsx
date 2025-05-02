import { auth } from "@clerk/nextjs/server";
import ChatPage from "@/components/Chat/ChatPage";
import { ChatPageLoading } from "@/components/Chat/ChatPageLoading";

// Export configuration for Next.js
export const dynamic = "force-dynamic";

export default async function NewChat() {
  // Get auth session but don't require authentication
  const session = await auth();
  const userId = session.userId;

  return (
    <ChatPage
      chatId=""
      initialMessages={[]}
      isAuthenticated={!!userId}
      isNewChat={true}
    />
  );
}
