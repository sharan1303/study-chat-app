import { redirect } from "next/navigation";

export default async function ModulePage(
  props: {
    params: Promise<{ moduleName: string }>;
  }
) {
  const params = await props.params;
  // Redirect to the chat page for this module
  redirect(`/${params.moduleName}/chat`);
}

// Add this export to allow dynamic rendering
export const dynamic = "force-dynamic";
