"use server";

import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function sendMessage(
  message: string,
  senderId: string,
  chatId: string
) {
  console.log("📤 SendMessage action called:");
  console.log("message: ", message);
  console.log("senderId: ", senderId);
  console.log("chatId: ", chatId);

  try {
    const [insertedMessage] = await db
      .insert(messages)
      .values({
        message,
        senderId,
        chatId,
        createdAt: new Date(),
      })
      .returning();

    console.log("✅ Message inserted successfully:", insertedMessage);

    revalidatePath("/chat");

    return {
      success: true,
      message: insertedMessage,
    };
  } catch (error) {
    console.error("❌ Error inserting message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
