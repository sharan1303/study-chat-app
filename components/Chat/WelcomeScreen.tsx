import { ModuleWithResources } from "@/lib/actions";

interface WelcomeScreenProps {
  moduleDetails?: ModuleWithResources | null;
  chatId?: string;
  modelName?: string;
}

export default function WelcomeScreen({
  moduleDetails,
  chatId,
  modelName = "Gemini 2.0 Flash",
}: WelcomeScreenProps) {
  return (
    <div className="text-center flex items-center justify-center h-screen pb-20 space-y-2">
      <div className="flex-col space-y-3">
        <h3 className="text-3xl font-normal">Welcome to Study Chat</h3>
        <p className="text-muted-foreground">
          {moduleDetails
            ? `Using ${moduleDetails.name} module for context`
            : "Create a module to add context to your chats"}
        </p>
        {modelName && (
          <p className="text-xs text-muted-foreground mt-2">
            Powered by {modelName}
          </p>
        )}
      </div>
    </div>
  );
}
