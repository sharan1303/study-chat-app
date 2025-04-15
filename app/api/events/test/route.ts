import { NextRequest, NextResponse } from "next/server";
import { broadcastEvent, EVENT_TYPES } from "@/lib/events";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetId = searchParams.get("targetId");
    const eventType = searchParams.get("eventType") || EVENT_TYPES.CHAT_CREATED;

    if (!targetId) {
      return NextResponse.json(
        { error: "Target ID is required" },
        { status: 400 }
      );
    }

    console.log(`[TEST] Sending test ${eventType} event to client ${targetId}`);

    // Create test data based on the event type
    let testData;
    const moduleId = searchParams.get("moduleId");

    if (eventType === EVENT_TYPES.CHAT_CREATED) {
      testData = {
        id: `test-chat-${Date.now()}`,
        title: "Test Chat",
        moduleId: moduleId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Include mock module data for module chats
      if (moduleId) {
        testData.module = {
          id: moduleId,
          name: "Test Module",
          icon: "📚",
        };
      }
    } else if (eventType === EVENT_TYPES.MESSAGE_CREATED) {
      const chatId = searchParams.get("chatId") || `test-chat-${Date.now()}`;
      testData = {
        id: `test-message-${Date.now()}`,
        chatId: chatId,
        chatTitle: "Test Chat",
        updatedAt: new Date().toISOString(),
        moduleId: moduleId || null,
      };

      // Include mock module data for module chats
      if (moduleId) {
        testData.module = {
          id: moduleId,
          name: "Test Module",
          icon: "📚",
        };
      }
    } else {
      testData = {
        id: `test-${Date.now()}`,
        type: "test",
      };
    }

    // Broadcast the test event
    const result = broadcastEvent(eventType, testData, [targetId]);

    console.log(`[TEST] Test event broadcast result:`, result);

    return NextResponse.json({
      success: true,
      eventType,
      targetId,
      data: testData,
      result,
    });
  } catch (error) {
    console.error("[TEST] Error sending test event:", error);
    return NextResponse.json(
      { error: "Failed to send test event" },
      { status: 500 }
    );
  }
}

// Ensure this route is dynamic
export const dynamic = "force-dynamic";
