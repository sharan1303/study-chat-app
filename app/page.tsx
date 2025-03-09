import ClientChatPage from "./ClientChatPage";
import { Suspense } from "react";
import { ChatPageLoading } from "./ClientChatPage";

// Home page server component
export default async function Home() {
  // Render the default chat page without any specific module
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ClientChatPage initialModuleDetails={null} />
    </Suspense>
  );
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
