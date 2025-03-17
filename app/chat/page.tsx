import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ClientChatPage from "@/app/ClientChatPage";
import { ChatPageLoading } from "@/app/ClientChatPage";
import { generateId } from "@/lib/utils";

export default async function NewChat() {
  const session = await auth();

  if (!session.userId) {
    return notFound();
  }

  // Generate a new chat ID but don't redirect
  const chatId = generateId();

  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ClientChatPage
        initialModuleDetails={null}
        chatId={chatId}
        initialMessages={[]}
      />
    </Suspense>
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
