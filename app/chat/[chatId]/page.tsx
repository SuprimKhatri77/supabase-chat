import Message, {
  ChatWithUser,
  MessageWithChatUser,
} from "@/components/MessageComponent";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { and, or, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  if (!chatId || !isValidUUID(chatId)) {
    return redirect("/chat"); // or show 404
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  const currentUser = await db.query.user.findFirst({
    where: (fields, { eq }) => eq(fields.id, session.user.id),
  });

  if (!currentUser) {
    return redirect("/sign-up");
  }

  const chatRecord = await db.query.chats.findFirst({
    where: (fields, { eq, or, and }) =>
      or(
        and(eq(fields.id, chatId), eq(fields.senderId, currentUser.id)),
        and(eq(fields.id, chatId), eq(fields.receiverId, currentUser.id))
      ),
    with: {
      sender: true,
      receiver: true,
    },
  });

  if (!chatRecord) {
    return redirect("/chat");
  }

  if (!chatRecord.sender || !chatRecord.receiver) {
    console.error("Chat record missing sender or receiver data");
    return redirect("/chat");
  }

  const chatWithUser: ChatWithUser = {
    ...chatRecord,
    sender: chatRecord.sender,
    receiver: chatRecord.receiver,
  };

  const messages: MessageWithChatUser[] = (await db.query.messages.findMany({
    where: (fields, { eq }) => eq(fields.chatId, chatId),
    with: {
      chats: {
        with: {
          sender: true,
          receiver: true,
        },
      },
    },
    orderBy: (fields, { asc }) => asc(fields.createdAt),
  })) as MessageWithChatUser[];

  return (
    <Message
      messages={messages ?? []}
      chatRecord={chatWithUser}
      currentUser={currentUser}
    />
  );
}
