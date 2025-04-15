"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrCreateSessionIdClient } from "@/lib/session";
import { EVENT_TYPES } from "@/lib/events";

export default function EventTester() {
  const { userId, isSignedIn } = useAuth();
  const [targetId, setTargetId] = useState<string>("");
  const [moduleId, setModuleId] = useState<string>("");
  const [chatId, setChatId] = useState<string>("");
  const [sseStatus, setSSEStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES.CHAT_CREATED);
  const [result, setResult] = useState<{
    status: "sending" | "success" | "error";
    data?: Record<string, unknown>;
    error?: string;
  } | null>(null);

  // Init target ID based on auth state
  useEffect(() => {
    if (isSignedIn && userId) {
      setTargetId(userId);
    } else {
      const sessionId = getOrCreateSessionIdClient();
      if (sessionId) {
        setTargetId(sessionId);
      }
    }
  }, [isSignedIn, userId]);

  // Check SSE connection status
  useEffect(() => {
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      if (sseStatus === "checking") {
        setSSEStatus("disconnected");
      }
    }, 5000);

    // Listen for SSE events
    const handleSSEEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[EventTester] SSE event received:", data);

        if (data.type === "CONNECTION_ACK") {
          setSSEStatus("connected");
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("[EventTester] Error parsing SSE event:", error);
      }
    };

    window.addEventListener("message", (e) => {
      if (e.data && e.data.type === "SSE_EVENT") {
        handleSSEEvent(e.data.event);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      // We don't remove the message event listener because it's global
    };
  }, [sseStatus]);

  const handleSendTest = async () => {
    if (!targetId) return;

    try {
      setResult({ status: "sending" });

      // Build query parameters
      const params = new URLSearchParams();
      params.append("targetId", targetId);
      params.append("eventType", eventType);

      if (moduleId) {
        params.append("moduleId", moduleId);
      }

      if (chatId) {
        params.append("chatId", chatId);
      }

      // Send test event
      const response = await fetch(`/api/events/test?${params.toString()}`);
      const data = await response.json();

      setResult({ status: "success", data });
    } catch (error) {
      console.error("[EventTester] Error sending test event:", error);
      setResult({ status: "error", error: String(error) });
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-bold mb-2">SSE Event Tester</h2>

      <div className="space-y-4">
        <div>
          <p className="text-sm mb-1">SSE Connection Status:</p>
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                sseStatus === "connected"
                  ? "bg-green-500"
                  : sseStatus === "disconnected"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            />
            <span>
              {sseStatus === "connected"
                ? "Connected"
                : sseStatus === "disconnected"
                ? "Disconnected"
                : "Checking..."}
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm mb-1">Target ID:</p>
          <Input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="User ID or Session ID"
            className="w-full"
          />
        </div>

        <div>
          <p className="text-sm mb-1">Event Type:</p>
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EVENT_TYPES.CHAT_CREATED}>
                Chat Created
              </SelectItem>
              <SelectItem value={EVENT_TYPES.MESSAGE_CREATED}>
                Message Created
              </SelectItem>
              <SelectItem value={EVENT_TYPES.MODULE_CREATED}>
                Module Created
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm mb-1">Module ID (optional):</p>
          <Input
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            placeholder="For module-specific events"
            className="w-full"
          />
        </div>

        <div>
          <p className="text-sm mb-1">Chat ID (optional):</p>
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="For message events"
            className="w-full"
          />
        </div>

        <Button onClick={handleSendTest} disabled={!targetId}>
          Send Test Event
        </Button>

        {/* Quick Test Button for Module Chats */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-md font-semibold mb-2">
            Module Chat Quick Tests
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                if (!targetId || !moduleId) {
                  alert("Please enter Target ID and Module ID first");
                  return;
                }

                // Generate a test chat ID that will be used for both events
                const testChatId = `test-module-chat-${Date.now()}`;
                setChatId(testChatId);

                // First send chat created event
                setEventType(EVENT_TYPES.CHAT_CREATED);
                await handleSendTest();

                // Wait 1 second then send a message created event for the same chat
                setTimeout(async () => {
                  setEventType(EVENT_TYPES.MESSAGE_CREATED);
                  // By this point the chatId should be set in the state
                  await handleSendTest();
                }, 1000);
              }}
              disabled={!targetId || !moduleId}
            >
              Test Module Chat Flow
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Create event listener to capture SSE events
                const listener = (event: MessageEvent) => {
                  if (event.data && event.data.type === "SSE_EVENT") {
                    console.log("[SSE CAPTURE]", event.data.event);
                  }
                };

                window.addEventListener("message", listener);

                // Show alert with instructions
                alert(
                  "SSE event capturing enabled. Check console for events. Refresh page to disable."
                );
              }}
            >
              Enable SSE Debug
            </Button>
          </div>
        </div>

        {result && (
          <div className="mt-4">
            <h3 className="text-md font-semibold">Result:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
