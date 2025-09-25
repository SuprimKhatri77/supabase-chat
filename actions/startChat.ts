"use server";

import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function startChat(userId1: string, userId2: string) {
  const [senderId, receiverId] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const existing = await db.query.chats.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.senderId, senderId), eq(fields.receiverId, receiverId)),
  });

  if (existing) {
    return redirect(`/chat/${existing.id}`);
  }

  const [newChat] = await db
    .insert(chats)
    .values({ senderId, receiverId })
    .returning();

  return redirect(`/chat/${newChat.id}`);
}
