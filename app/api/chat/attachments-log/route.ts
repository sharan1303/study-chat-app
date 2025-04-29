import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Extract the data we want to log
    const body = await request.json();

    // Log the attachment info
    console.log("=============== ATTACHMENT DEBUG LOG ===============");
    console.log(`Received ${body.attachments?.length || 0} attachments`);

    if (body.attachments && body.attachments.length > 0) {
      body.attachments.forEach((attachment: any, index: number) => {
        console.log(`Attachment #${index + 1}:`);
        console.log(`  Type: ${attachment.mimeType}`);
        console.log(`  Name: ${attachment.name || "unnamed"}`);
        console.log(
          `  Data length: ${attachment.data?.length || 0} characters`
        );
        console.log(
          `  Approx size: ${Math.ceil(
            ((attachment.data?.length || 0) * 0.75) / 1024
          )} KB`
        );
      });
    }

    console.log("====================================================");

    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in attachment log:", error);
    return NextResponse.json(
      {
        error: "Failed to log attachments",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
