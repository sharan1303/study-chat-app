import { redirect } from "next/navigation";

export default function Home() {
  // Always redirect to the chat page
  return redirect("/chat");
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
