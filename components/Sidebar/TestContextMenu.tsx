"use client";

import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export default function TestContextMenu() {
  const [message, setMessage] = useState(
    "Right-click on this component to test the context menu"
  );

  return (
    <div className="p-4 text-center">
      <ContextMenu>
        <ContextMenuTrigger className="flex w-full items-center justify-center">
          <div className="bg-muted p-4 rounded-md cursor-pointer w-full">
            {message}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => setMessage("You clicked: Option 1")}
            className="cursor-pointer text-xs"
          >
            Option 1
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setMessage("You clicked: Option 2")}
            className="cursor-pointer text-xs"
          >
            Option 2
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
