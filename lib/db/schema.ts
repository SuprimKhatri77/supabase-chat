import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    senderId: text("sender_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    receiverId: text("receiver_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow(),
    lastMessageAt: timestamp("last_message_at"),
  },
  (table) => [
    uniqueIndex("unique_sender_receiver").on(table.senderId, table.receiverId),
  ]
);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  senderId: text("sender_id").references(() => user.id),
  chatId: uuid("chat_id").references(() => chats.id),
  message: text("message"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow(),
  isEdited: boolean("is_edited").default(false),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const userRelation = relations(user, ({ many }) => ({
  sentChats: many(chats, { relationName: "sender" }),
  receivedChats: many(chats, { relationName: "receiver" }),
  sentMessages: many(messages),
}));

export const chatsRelation = relations(chats, ({ one, many }) => ({
  sender: one(user, {
    fields: [chats.senderId],
    references: [user.id],
    relationName: "sender",
  }),
  receiver: one(user, {
    fields: [chats.receiverId],
    references: [user.id],
    relationName: "receiver",
  }),
  messages: many(messages),
}));

export const messageRelation = relations(messages, ({ one }) => ({
  sender: one(user, {
    fields: [messages.senderId],
    references: [user.id],
  }),
  chats: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

export type UserSelectType = InferSelectModel<typeof user>;
export type UserInsertType = InferInsertModel<typeof user>;
export type ChatSelectType = InferSelectModel<typeof chats>;
export type ChatInsertType = InferInsertModel<typeof chats>;
export type MessageSelectType = InferSelectModel<typeof messages>;
export type MessageInsertType = InferInsertModel<typeof messages>;
