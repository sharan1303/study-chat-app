import { getModuleDetails } from "./actions";
import ClientChatPage from "./ClientChatPage";
import { Suspense } from "react";
import { ChatPageLoading } from "./ClientChatPage";
import { redirect } from "next/navigation";

// Home page server component
export default async function Home() {
  // Render the default chat page without any specific module
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ClientChatPage initialModuleDetails={null} />
    </Suspense>
  );
}
