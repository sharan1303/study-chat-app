"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { encodeModuleSlug, getOSModifierKey } from "@/lib/utils";

// Custom event name for opening the module dialog
const OPEN_MODULE_DIALOG_EVENT = "open-module-dialog";
// Custom event name for opening the resource upload dialog
const OPEN_RESOURCE_UPLOAD_DIALOG_EVENT = "open-resource-upload-dialog";

// Interface for module objects
interface Module {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

// Interface for chat objects
interface Chat {
  id: string;
  title: string;
  moduleId?: string;
  module?: {
    id: string;
    name: string;
    icon?: string;
  };
  updatedAt?: string;
}

export function CommandK() {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modKey, setModKey] = useState("Ctrl/⌘"); // Default for SSR
  const router = useRouter();

  // Set the correct modifier key based on platform
  useEffect(() => {
    setModKey(getOSModifierKey());
  }, []);

  // Fetch modules and chats when the command palette opens
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          setLoading(true);

          // Fetch modules and chats in parallel
          const [modulesResponse, chatsResponse] = await Promise.all([
            api.getModules(),
            api.getChatHistory(),
          ]);

          setModules(modulesResponse.modules || []);
          setChats(chatsResponse || []);
        } catch (error) {
          console.error("Error fetching data:", error);
          setModules([]);
          setChats([]);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      // Reset search when closing the dialog
      setSearchQuery("");
    }
  }, [open]);

  // Filter modules and chats based on search query
  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { modules: [], chats: [] };

    const normalizedQuery = searchQuery.toLowerCase().trim();

    // Filter modules - search in name
    const filteredModules = modules.filter((module) =>
      module.name.toLowerCase().includes(normalizedQuery)
    );

    // Filter chats - search in both title and ID
    const filteredChats = chats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(normalizedQuery) ||
        chat.id.toLowerCase().includes(normalizedQuery)
    );

    return { modules: filteredModules, chats: filteredChats };
  }, [modules, chats, searchQuery]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Handler for creating a new module
  const handleCreateModule = () => {
    setOpen(false);
    // Dispatch a custom event to open the module dialog
    // This will be caught by the GlobalModuleDialog component
    const event = new CustomEvent(OPEN_MODULE_DIALOG_EVENT);
    document.dispatchEvent(event);
  };

  // Handler for opening the resource upload dialog
  const handleResourceUpload = () => {
    setOpen(false);
    // Dispatch a custom event to open the resource upload dialog
    const event = new CustomEvent(OPEN_RESOURCE_UPLOAD_DIALOG_EVENT);
    document.dispatchEvent(event);
  };

  // Handler for creating a new chat
  const handleCreateChat = () => {
    setOpen(false);
    router.push("/chat");
  };

  // Handler for navigating to a module's detail page
  const handleModuleSelect = (moduleName: string) => {
    setOpen(false);
    const encodedName = encodeModuleSlug(moduleName);
    router.push(`/modules/${encodedName}`);
  };

  // Handler for navigating to a chat
  const handleChatSelect = (chatId: string) => {
    setOpen(false);
    router.push(`/chat/${chatId}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Menu</DialogTitle>
      <CommandInput
        placeholder={`Type a command or search for modules and chats... (${modKey}+K)`}
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="bg-transparent border-none focus:ring-0"
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Loading..." : "No results found."}
        </CommandEmpty>

        {!searchQuery && (
          <>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={handleCreateChat} value="create-new-chat">
                <span>Create New Chat</span>
                <CommandShortcut>{modKey} I</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={handleCreateModule}
                value="create-new-module"
              >
                <span>Create New Module</span>
                <CommandShortcut>{modKey} J</CommandShortcut>
              </CommandItem>

              <CommandItem
                onSelect={handleResourceUpload}
                value="upload-resource"
              >
                <span>Upload Resource</span>
                <CommandShortcut>{modKey} U</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              <CommandItem
                value="nav-modules"
                onSelect={() => {
                  setOpen(false);
                  router.push("/modules");
                }}
              >
                <span>Modules & Resources dashboard</span>
              </CommandItem>
              <CommandItem
                value="nav-settings"
                onSelect={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
              >
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {filteredResults.modules.length > 0 && (
          <CommandGroup heading="Modules">
            {filteredResults.modules.map((module) => (
              <CommandItem
                key={module.id}
                value={`module-${module.id}-${module.name.toLowerCase()}`}
                onSelect={() => handleModuleSelect(module.name)}
              >
                <span>{module.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredResults.chats.length > 0 && (
          <CommandGroup heading="Chats">
            {filteredResults.chats.map((chat) => (
              <CommandItem
                key={chat.id}
                value={`chat-${chat.id}-${chat.title.toLowerCase()}`}
                onSelect={() => handleChatSelect(chat.id)}
              >
                <div className="flex justify-between w-full items-center">
                  <div className="flex flex-col">
                    <span>{chat.title}</span>
                    {chat.module && (
                      <span className="text-xs text-muted-foreground">
                        {chat.module.name}
                      </span>
                    )}
                  </div>
                  {chat.updatedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
