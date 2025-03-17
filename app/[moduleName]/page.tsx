import { redirect } from "next/navigation";

export default function ModulePage({
  params,
}: {
  params: { moduleName: string };
}) {
  // Redirect to the chat page for this module
  redirect(`/${params.moduleName}/chat`);
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
