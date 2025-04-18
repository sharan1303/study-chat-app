import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// List of available icons
const icons = [
  "📚",
  "🧠",
  "🔬",
  "🧮",
  "🌍",
  "🖥️",
  "📊",
  "📝",
  "🎨",
  "🎭",
  "🏛️",
  "⚗️",
  "🔢",
  "📜",
  "🎵",
];

interface ModuleIconEditorProps {
  icon: string;
  updateModule: (updates: {
    name?: string | undefined;
    context?: string | undefined;
    icon?: string | undefined;
  }) => Promise<
    | {
        success: boolean;
        requiresRefresh?: boolean;
        formattedName?: string;
      }
    | undefined
  >;
}

export default function ModuleIconEditor({
  icon,
  updateModule,
}: ModuleIconEditorProps) {
  // Handle icon update
  const handleIconChange = async (newIcon: string) => {
    await updateModule({ icon: newIcon });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="text-xl cursor-pointer hover:bg-muted h-10 w-10"
          aria-label="Module icon picker"
        >
          {icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-1">
          {icons.map((iconItem) => (
            <Button
              key={iconItem}
              variant={iconItem === icon ? "default" : "outline"}
              className="h-10 w-10 text-xl"
              onClick={() => handleIconChange(iconItem)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleIconChange(iconItem);
                }
              }}
            >
              {iconItem}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
