import ChatComponent from "@/components/ChatComponent";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import {
  chats,
  ChatSelectType,
  messages,
  MessageSelectType,
  user,
  UserSelectType,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type ChatWithUserMessages = ChatSelectType & {
  messages: MessageSelectType[];
  sender: UserSelectType;
  receiver: UserSelectType;
};

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return redirect("/login");
  }
  // console.log("session: ");

  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id));
  if (!currentUser) return redirect("/sign-up");

  const users: UserSelectType[] = await db.query.user.findMany({
    where: (fields, { ne }) => ne(user.id, session.user.id),
  });

  // console.log("users: ");
  const chatsRecord: ChatWithUserMessages[] = (await db.query.chats.findMany({
    where: (fields, { eq, or }) =>
      or(
        eq(chats.senderId, session.user.id),
        eq(chats.receiverId, session.user.id)
      ),
    with: {
      sender: true,
      receiver: true,
      messages: true,
    },
  })) as ChatWithUserMessages[];

  console.log("rednering the component now");
  return (
    <ChatComponent
      users={users ?? []}
      currentUser={currentUser}
      chats={chatsRecord ?? []}
    />
  );
}
