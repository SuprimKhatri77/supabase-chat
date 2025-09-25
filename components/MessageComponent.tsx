"use client";

import {
  ChatSelectType,
  MessageSelectType,
  UserSelectType,
} from "@/lib/db/schema";
import Image from "next/image";
import { Input } from "./ui/input";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/actions/sendMessage";

export type MessageWithChatUser = MessageSelectType & {
  chats: ChatSelectType & {
    sender: UserSelectType;
    receiver: UserSelectType;
  };
};

export type ChatWithUser = ChatSelectType & {
  sender: UserSelectType;
  receiver: UserSelectType;
};

export default function Message({
  messages,
  chatRecord,
  currentUser,
}: {
  messages: MessageWithChatUser[];
  chatRecord: ChatWithUser;
  currentUser: UserSelectType;
}) {
  console.log("🎯 Message Component Rendered", {
    messagesCount: messages.length,
    chatId: chatRecord.id,
    currentUserId: currentUser.id,
  });

  const [messageText, setMessageText] = useState<string>("");
  const [liveMessages, setLiveMessages] =
    useState<MessageWithChatUser[]>(messages);
  const [pending, setPending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  console.log("🔌 Supabase client created:", !!supabase);

  const otherUser =
    chatRecord.senderId === currentUser.id
      ? chatRecord.receiver
      : chatRecord.sender;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [liveMessages]);

  useEffect(() => {
    console.log("🚀 useEffect RUNNING for chat:", chatRecord.id);
    console.log(
      "🚀 Supabase client status:",
      supabase ? "✅ Available" : "❌ Not available"
    );

    setLiveMessages(messages);

    console.log("🔌 Testing Supabase connection...");

    const channelName = `chat-${chatRecord.id}`;
    console.log("📡 Creating channel:", channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("🎯 RECEIVED ANY MESSAGE EVENT:", payload);
          console.log("🎯 Event type:", payload.eventType);
          console.log("🎯 Table:", payload.table);
          console.log("🎯 Schema:", payload.schema);
          console.log("🎯 New data:", payload.new);
          console.log("🎯 Old data:", payload.old);

          if (payload.new) {
            const rawData = payload.new as any;
            console.log("🎯 Raw chat_id from payload:", rawData.chat_id);
            console.log("🎯 Current chat ID:", chatRecord.id);
            console.log("🎯 Do they match?", rawData.chat_id === chatRecord.id);

            if (rawData.chat_id === chatRecord.id) {
              console.log("✅ This message is for current chat!");

              const newMessageData: MessageSelectType = {
                id: rawData.id,
                senderId: rawData.sender_id,
                chatId: rawData.chat_id,
                message: rawData.message,
                attachmentUrl: rawData.attachment_url,
                createdAt: rawData.created_at,
                isEdited: rawData.is_edited,
                updatedAt: rawData.updated_at,
              };

              const newMessage: MessageWithChatUser = {
                ...newMessageData,
                chats: {
                  ...chatRecord,
                  sender: chatRecord.sender,
                  receiver: chatRecord.receiver,
                },
              };

              setLiveMessages((prevMessages) => {
                const messageExists = prevMessages.some(
                  (msg) => msg.id === newMessage.id
                );
                if (messageExists) {
                  console.log("⚠️ Message already exists, skipping");
                  return prevMessages;
                }

                const updated = [...prevMessages, newMessage];
                console.log("📝 Updated messages count:", updated.length);
                return updated;
              });
            } else {
              console.log("⚠️ Message for different chat, ignoring");
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log("🔗 Subscription status:", status);
        if (err) {
          console.error("❌ Subscription error:", err);
        }

        switch (status) {
          case "SUBSCRIBED":
            console.log(
              "✅ Successfully subscribed to real-time updates for chat:",
              chatRecord.id
            );
            break;
          case "CHANNEL_ERROR":
            console.error(
              "❌ Channel subscription error for chat:",
              chatRecord.id
            );
            break;
          case "TIMED_OUT":
            console.error("⏰ Subscription timed out for chat:", chatRecord.id);
            break;
          case "CLOSED":
            console.log("🔒 Subscription closed for chat:", chatRecord.id);
            break;
          default:
            console.log("🔄 Subscription status:", status);
        }
      });

    console.log("📡 Channel created for chat:", chatRecord.id);

    return () => {
      console.log("🧹 Cleaning up channel for chat:", chatRecord.id);
      try {
        supabase.removeChannel(channel);
        console.log("✅ Channel cleaned up successfully");
      } catch (error) {
        console.error("❌ Error cleaning up channel:", error);
      }
    };
  }, [chatRecord.id]);

  const handleSend = async () => {
    if (!messageText.trim()) return;

    console.log("📤 Sending message:", {
      message: messageText,
      senderId: currentUser.id,
      chatId: chatRecord.id,
    });

    setPending(true);
    try {
      const result = await sendMessage(
        messageText,
        currentUser.id,
        chatRecord.id
      );
      console.log("✅ Message sent result:", result);

      if (result) {
        setMessageText("");
      } else {
        console.error("❌ Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
    } finally {
      setPending(false);
    }
  };

  const currentChatMessages = liveMessages.filter(
    (message) => message.chatId === chatRecord.id
  );

  return (
    <div className="min-h-screen flex flex-col my-4 max-w-3xl mx-auto w-full bg-slate-100 py-5 px-4 rounded-lg">
      <div className="w-full flex items-center gap-7 py-2 px-3">
        <Image
          src={
            otherUser.image ||
            "https://5wt23w8lat.ufs.sh/f/4Ina5a0Nyj35BpvnC8GfqH2grxZLMciEXY3e04oTybQNdzD5"
          }
          alt="profile picture"
          width={40}
          height={40}
          className="object-cover object-center rounded-full"
        />
        <h1 className="text-lg font-medium capitalize">{otherUser.name}</h1>
      </div>
      <div className="w-full h-[2px] bg-black"></div>

      <div className="flex-1 flex flex-col justify-end px-4 py-2 overflow-y-auto">
        {currentChatMessages.length > 0 ? (
          <div className="flex flex-col">
            {currentChatMessages.map((message) => {
              const isCurrentUser = message.senderId === currentUser.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  } mb-2`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs ${
                      isCurrentUser
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-300 text-black rounded-bl-none"
                    }`}
                  >
                    {message.message}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="h-full pb-5">
            <p>This is the start of your conversation with {otherUser.name}</p>
          </div>
        )}
      </div>

      <div className="min-h-full flex justify-end relative">
        <Input
          className="rounded-full border-gray-400"
          type="text"
          onChange={(e) => setMessageText(e.target.value)}
          value={messageText}
          onKeyDown={(e) => e.key === "Enter" && !pending && handleSend()}
          disabled={pending}
          placeholder="Type a message..."
        />
        <div className="absolute top-2 right-4">
          <button
            className="bg-transparent text-black hover:bg-transparent cursor-pointer hover:scale-105 duration-300 transition-all disabled:opacity-50"
            onClick={handleSend}
            disabled={pending || !messageText.trim()}
          >
            {pending ? (
              <div className="inline-block border-green-400 h-4 w-4 animate-spin rounded-full border-2 border-solid border-e-transparent">
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124z" />
                <path d="M6.5 12h14.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
