import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  username: text('username').notNull(),
  email: text('email'),
  role: text('role').default('member'),
  gender: text('gender').default('male'),
  age: integer('age').default(20),
  country: text('country').default('اليمن'),
  avatar: text('avatar').default('https://api.dicebear.com/7.x/bottts/svg?seed=user'),
  bio: text('bio').default(''),
  coins: integer('coins').default(0),
  likes: integer('likes').default(0),
  usernameColor: text('username_color'),
  usernameBgGradient: text('username_bg_gradient'),
  isNeon: boolean('is_neon').default(false),
  joinedDate: text('joined_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  roomId: text('room_id').notNull().default('room-1'),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  senderAvatar: text('sender_avatar'),
  senderRole: text('sender_role').default('member'),
  senderColor: text('sender_color'),
  senderBgGradient: text('sender_bg_gradient'),
  text: text('text').notNull(),
  type: text('type').default('text'),
  timestamp: text('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Private messages table
export const privateMessages = pgTable('private_messages', {
  id: serial('id').primaryKey(),
  fromUserId: text('from_user_id').notNull(),
  toUserId: text('to_user_id').notNull(),
  senderName: text('sender_name').notNull(),
  text: text('text').notNull(),
  timestamp: text('timestamp').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
}));
