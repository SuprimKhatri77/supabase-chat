"use client";

import {
  ChatSelectType,
  MessageSelectType,
  UserSelectType,
} from "@/lib/db/schema";
import React, { useState } from "react";
import LogoutButton from "./LogoutButton";
import Image from "next/image";
import { Button } from "./ui/button";
import { startChat } from "@/actions/startChat";

type Props = {
  users: UserSelectType[];
  chats: (ChatSelectType & {
    receiver: UserSelectType;
    messages: MessageSelectType[];
  })[];
  currentUser: UserSelectType;
};

const ChatComponent = ({ users, chats, currentUser }: Props) => {
  // console.log("users from comp: ", users);
  return (
    <div className="min-h-screen flex flex-col w-full">
      <div className="w-fit">
        <LogoutButton />
      </div>
      <div className="flex gap-5 flex-wrap items-center justify-center min-h-screen">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-slate-100 shadow-xl rounded-lg py-2 px-5 flex flex-col gap-5"
          >
            <div className="flex items-center gap-2">
              <p>{user.name}</p>
              <Image
                src={
                  user.image ||
                  "https://5wt23w8lat.ufs.sh/f/4Ina5a0Nyj35BpvnC8GfqH2grxZLMciEXY3e04oTybQNdzD5"
                }
                alt="profile image"
                width={100}
                height={100}
                className="rounded-full"
              />
            </div>
            {/* <p>{user.email}</p> */}
            <Button
              onClick={async () => {
                await startChat(currentUser.id, user.id);
              }}
            >
              Chat
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatComponent;
