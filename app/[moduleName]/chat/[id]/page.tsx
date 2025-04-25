import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ChatPage from "@/components/Chat/ChatPage";
import { ChatPageLoading } from "@/components/Chat/ChatPageLoading";
import prisma from "@/lib/prisma";
import { decodeModuleSlug } from "@/lib/utils";

/**
 * Renders the module chat page with context tailored to the user's authentication status.
 *
 * This asynchronous component awaits route parameters and checks the user session. For unauthenticated users,
 * it renders a basic chat interface without module details. When the user is authenticated, it retrieves the user record,
 * decodes the module name, and fetches the corresponding module and chat data from the database. Module date fields are converted
 * to ISO strings for client-side compatibility. If the user or module cannot be found, a 404 response is returned.
 *
 * @param props - Contains a promise that resolves to an object with the module’s encoded name and chat identifier.
 *
 * @returns A Suspense component that wraps the client chat page configured with the appropriate module and chat data.
 */
export default async function ModuleChatPage(props: {
  params: Promise<{ moduleName: string; id: string }>;
}) {
  const params = await props.params;
  const session = await auth();
  const userId = session.userId;
  const isAuthenticated = !!userId;

  // For unauthenticated users, show a basic chat interface without module context
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<ChatPageLoading />}>
        <ChatPage
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

  // Decode module name
  const decodedModuleName = decodeModuleSlug(params.moduleName);

  // Get module
  const moduleData = await prisma.module.findFirst({
    where: {
      userId: user.id,
      name: {
        mode: "insensitive",
        equals: decodedModuleName,
      },
    },
    include: {
      resources: true,
    },
  });

  if (!moduleData) {
    return notFound();
  }

  // Get chat if it exists
  const chat = await prisma.chat.findFirst({
    where: {
      id: params.id,
      userId: user.id,
      moduleId: moduleData.id,
    },
  });

  // Parse messages if chat exists
  const initialMessages = chat?.messages
    ? JSON.parse(JSON.stringify(chat.messages))
    : [];

  // Convert Prisma Date objects to ISO strings for client components
  const moduleWithStringDates = {
    ...moduleData,
    createdAt: moduleData.createdAt.toISOString(),
    updatedAt: moduleData.updatedAt.toISOString(),
    lastStudied: moduleData.lastStudied
      ? moduleData.lastStudied.toISOString()
      : null,
    resources: moduleData.resources.map((resource) => ({
      ...resource,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    })),
  };

  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPage
        initialModuleDetails={moduleWithStringDates}
        chatId={params.id}
        initialMessages={initialMessages}
        isAuthenticated={true}
      />
    </Suspense>
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
