"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// Custom event name for opening the resource upload dialog
const OPEN_RESOURCE_UPLOAD_DIALOG_EVENT = "open-resource-upload-dialog";

/**
 * Keyboard Shortcuts Context provides a centralized way to handle keyboard shortcuts
 * across the application. It includes functionality for handling common actions like
 * creating a new chat or module.
 */

// Define the context interface
interface KeyboardShortcutsContextType {
  registerShortcut: (key: string, handler: (e: KeyboardEvent) => void) => void;
  unregisterShortcut: (key: string) => void;
}

// Create the context with default values
const KeyboardShortcutsContext =
  React.createContext<KeyboardShortcutsContextType>({
    registerShortcut: () => {},
    unregisterShortcut: () => {},
  });

// Custom hook to use keyboard shortcuts
export function useKeyboardShortcuts() {
  return React.useContext(KeyboardShortcutsContext);
}

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const shortcutHandlersRef = React.useRef<
    Map<string, (e: KeyboardEvent) => void>
  >(new Map());

  // Register a shortcut
  const registerShortcut = React.useCallback(
    (key: string, handler: (e: KeyboardEvent) => void) => {
      shortcutHandlersRef.current.set(key, handler);
    },
    []
  );

  // Unregister a shortcut
  const unregisterShortcut = React.useCallback((key: string) => {
    shortcutHandlersRef.current.delete(key);
  }, []);

  // Handle keyboard events
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Command/Ctrl + I: New Chat
      if ((event.metaKey || event.ctrlKey) && event.key === "i") {
        event.preventDefault();
        router.push("/chat");
      }

      // Command/Ctrl + J: New Module is now handled by GlobalModuleDialog component
      // We removed the navigation code here to avoid conflicts

      // Command/Ctrl + U: Upload Resource
      if ((event.metaKey || event.ctrlKey) && event.key === "u") {
        event.preventDefault();
        // Dispatch custom event to open resource upload dialog
        const customEvent = new CustomEvent(OPEN_RESOURCE_UPLOAD_DIALOG_EVENT);
        document.dispatchEvent(customEvent);
      }

      // Execute any registered custom handlers
      const shortcutKey = `${event.metaKey || event.ctrlKey ? "cmd+" : ""}${
        event.key
      }`;
      const handler = shortcutHandlersRef.current.get(shortcutKey);
      if (handler) {
        handler(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const contextValue = React.useMemo(
    () => ({
      registerShortcut,
      unregisterShortcut,
    }),
    [registerShortcut, unregisterShortcut]
  );

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}
