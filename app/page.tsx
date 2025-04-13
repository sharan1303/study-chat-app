import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function HomePage() {
  // If the user has already been welcomed (has the cookie),
  // redirect them to the regular chat page
  const cookieStore = await cookies();
  const hasVisited = cookieStore.get("study-chat-visited");

  if (hasVisited) {
    // Redirect returning users to the regular chat page
    redirect("/chat");
  }

  // For first-time visitors, middleware will redirect to the welcome chat page
  // This is a fallback in case middleware didn't handle it for some reason
  redirect("/chat/welcome");
}

// Change from force-dynamic to static with revalidation
export const revalidate = 3600; // Revalidate once per hour
