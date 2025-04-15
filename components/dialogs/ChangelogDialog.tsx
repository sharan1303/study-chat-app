"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { getOSModifierKey } from "@/lib/utils";
import React from "react";

// Version of the app, increment when adding new changelog entries
const CURRENT_VERSION = "1.0.1";
const CHANGELOG_COOKIE_KEY = "app_changelog_version";

// Define TypeScript interfaces for our changelog data
interface ChangelogLink {
  text: string;
  href: string;
}

interface ChangelogEntry {
  type: string;
  description: string;
  link?: ChangelogLink;
}

interface VersionEntry {
  version: string;
  date: string;
  title?: string;
  changes: ChangelogEntry[];
}

// Changelog entries in reverse chronological order (newest first)
const CHANGELOG_ENTRIES: VersionEntry[] = [
  {
    version: "1.0.0",
    date: "April 6, 2025",
    changes: [
      {
        type: "Feature",
        description: "Launched Study Chat 🥳",
      },
      {
        type: "Feature",
        description: "Implemented real-time chat features",
      },
      {
        type: "Feature",
        description: "Provide context to your chat using modules",
      },
      {
        type: "Feature",
        description: "Upload documents to provide context",
      },
      {
        type: "Feature",
        description: "Added dark mode and light mode toggle",
      },
    ],
  },
  // Add more versions here as your app evolves
  {
    version: "1.0.1",
    date: "April 15, 2025",
    title: "",
    changes: [
      {
        type: "Fix",
        description: "Resolved issue with user authentication and signup",
      },
      {
        type: "Feature",
        description: "Improved UI for mobile devices",
      },
      {
        type: "Feature",
        description: `Implement keyboard shortcuts: 
        ◦ Copy chat message (Hover: ${getOSModifierKey()}+C)
        ◦ New chat (${getOSModifierKey()}+I),
        ◦ New module (${getOSModifierKey()}+J)
        ◦ Toggle sidebar (${getOSModifierKey()}+B) 
        ◦ Upload resources (${getOSModifierKey()}+U)
        `,

        link: { text: "View in Settings", href: "/settings" },
      },
      {
        type: "Feature",
        description: `Added Search / Command palette (${getOSModifierKey()}+K) for global navigation and search for modules and chat threads.`,
      },
      {
        type: "Fix",
        description: "Module chats not updating chat history",
      },
      {
        type: "Improvement",
        description: "Speed up app loading time and module dashboard",
      },
    ],
  },
];

export function ChangelogDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has seen the current changelog
    const lastSeenVersion = Cookies.get(CHANGELOG_COOKIE_KEY);

    if (!lastSeenVersion || lastSeenVersion !== CURRENT_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    // Set cookie with current version
    Cookies.set(CHANGELOG_COOKIE_KEY, CURRENT_VERSION, {
      expires: 365, // 1 year
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md rounded-lg sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>What's New</DialogTitle>
          <DialogDescription>
            Check out the latest updates and improvements.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="mt-4">
          <div className="space-y-6">
            {CHANGELOG_ENTRIES.map((entry) => (
              <div key={entry.version} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {entry.date}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                    v{entry.version}
                  </span>
                </div>

                <ul className="space-y-2">
                  {entry.changes.map((change, index) => (
                    <li key={index} className="flex gap-2 text-sm">
                      <span className="flex-shrink-0">•</span>
                      <span>
                        {change.type === "Fix" ||
                        change.type === "Improvement" ? (
                          <span className="font-bold">{`${change.type}: `}</span>
                        ) : (
                          ""
                        )}
                        {change.description.split("\n").map((line, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <br />}
                            {line}
                          </React.Fragment>
                        ))}
                        {change.link && (
                          <Link
                            href={change.link.href}
                            className="ml-1 text-muted-foreground hover:underline"
                          >
                            {change.link.text}
                          </Link>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button onClick={handleClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
