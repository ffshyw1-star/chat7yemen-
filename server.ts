import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import initSqlJs, { Database } from "sql.js";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { INITIAL_USERS, INITIAL_MESSAGES, INITIAL_ROOMS, INITIAL_NOTIFICATIONS, INITIAL_SITE_SETTINGS, INITIAL_CUSTOM_EMOJIS, INITIAL_NEWS, INITIAL_WALL_POSTS } from "./src/data/initialData";
import { Message, PrivateMessage, User, Room, IPModerationRecord, FriendRequest, Notification, SiteSettings, CustomEmojiItem, NewsPost, WallPost } from "./src/types";

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// SQLite D1 Database File Path
const DB_FILE = path.join(process.cwd(), "d1_chat_database.sqlite");
const EMOJI_BACKUP_FILE = path.join(process.cwd(), "custom_emojis_store.json");
let db: Database;

// Helper to safely load emojis from disk backup file
function loadEmojisFromDiskBackup(): CustomEmojiItem[] {
  try {
    if (fs.existsSync(EMOJI_BACKUP_FILE)) {
      const content = fs.readFileSync(EMOJI_BACKUP_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading emoji backup file:", e);
  }
  return [];
}

// Helper to safely write emojis to disk backup file
function saveEmojisToDiskBackup(emojis: CustomEmojiItem[]) {
  try {
    fs.writeFileSync(EMOJI_BACKUP_FILE, JSON.stringify(emojis, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing emoji backup file:", e);
  }
}

// Save D1 SQLite database state to disk atomically
function saveD1ToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, buffer);
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error("Error writing D1 database to disk:", err);
    throw err;
  }
}

// In-Memory state for live broadcast
let serverUsers: User[] = [];
let serverMessages: Message[] = [];
let serverPrivateMessages: PrivateMessage[] = [];
let serverFriendRequests: FriendRequest[] = [];
let serverRooms: Room[] = [];
let serverIPModerations: IPModerationRecord[] = [];
let serverNotifications: Notification[] = [];
let serverCustomEmojis: CustomEmojiItem[] = [];
let serverNews: NewsPost[] = [...INITIAL_NEWS];
let serverWallPosts: WallPost[] = [...INITIAL_WALL_POSTS];
let serverSiteSettings: SiteSettings = { ...INITIAL_SITE_SETTINGS };

// Helper to extract client real IP
function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const parts = forwarded.split(",");
    if (parts[0] && parts[0].trim()) {
      let ip = parts[0].trim();
      if (ip.startsWith("::ffff:")) ip = ip.substring(7);
      return ip;
    }
  }
  const remote = req.socket.remoteAddress;
  if (remote) {
    if (remote.startsWith("::ffff:")) return remote.substring(7);
    if (remote === "::1") return "127.0.0.1";
    return remote;
  }
  return "127.0.0.1";
}

// Function to completely reset database to clean initial state
function resetD1Database() {
  if (!db) return;
  try {
    // Preserve custom emojis so owner's stickers/emojis are never wiped on reset or rebuild
    const existingBackupEmojis = loadEmojisFromDiskBackup();
    let preservedEmojis: CustomEmojiItem[] = existingBackupEmojis.length > 0 ? existingBackupEmojis : [...serverCustomEmojis];
    try {
      const emojiRows = db.exec("SELECT data FROM custom_emojis");
      if (emojiRows.length > 0 && emojiRows[0].values.length > 0) {
        const fromDb: CustomEmojiItem[] = emojiRows[0].values.map((v) => JSON.parse(v[0] as string));
        if (fromDb.length > 0) {
          const map = new Map<string, CustomEmojiItem>();
          preservedEmojis.forEach(e => map.set(e.id, e));
          fromDb.forEach(e => map.set(e.id, e));
          preservedEmojis = Array.from(map.values());
        }
      }
    } catch (e) {}

    serverCustomEmojis = preservedEmojis.length > 0 ? preservedEmojis : [...INITIAL_CUSTOM_EMOJIS];
    saveEmojisToDiskBackup(serverCustomEmojis);

    db.run(`
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS messages;
      DROP TABLE IF EXISTS private_messages;
      DROP TABLE IF EXISTS rooms;
      DROP TABLE IF EXISTS news;
      DROP TABLE IF EXISTS wall_posts;
      DROP TABLE IF EXISTS reports;
      DROP TABLE IF EXISTS friend_requests;
      DROP TABLE IF EXISTS ip_moderations;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS custom_emojis;
    `);

    db.run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT,
        role TEXT,
        data TEXT
      );
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        roomId TEXT,
        senderId TEXT,
        timestamp TEXT,
        data TEXT
      );
      CREATE TABLE private_messages (
        id TEXT PRIMARY KEY,
        senderId TEXT,
        receiverId TEXT,
        timestamp TEXT,
        data TEXT
      );
      CREATE TABLE rooms (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE news (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE wall_posts (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE reports (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE friend_requests (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE ip_moderations (
        id TEXT PRIMARY KEY,
        ip TEXT,
        type TEXT,
        data TEXT
      );
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        userId TEXT,
        timestamp TEXT,
        data TEXT
      );
      CREATE TABLE custom_emojis (
        id TEXT PRIMARY KEY,
        tag TEXT,
        name TEXT,
        category TEXT,
        data TEXT
      );
    `);

    serverUsers = [...INITIAL_USERS];
    serverRooms = [...INITIAL_ROOMS];
    serverMessages = [...INITIAL_MESSAGES];
    serverPrivateMessages = [];
    serverFriendRequests = [];
    serverIPModerations = [];
    serverNotifications = [...INITIAL_NOTIFICATIONS];
    serverNews = [...INITIAL_NEWS];
    serverWallPosts = [...INITIAL_WALL_POSTS];

    const uStmt = db.prepare("INSERT OR REPLACE INTO users (id, username, role, data) VALUES (?, ?, ?, ?)");
    serverUsers.forEach((u) => {
      uStmt.run([u.id, u.username, u.role, JSON.stringify(u)]);
    });
    uStmt.free();

    const mStmt = db.prepare("INSERT OR REPLACE INTO messages (id, roomId, senderId, timestamp, data) VALUES (?, ?, ?, ?, ?)");
    serverMessages.forEach((m) => {
      mStmt.run([m.id, m.roomId, m.senderId, m.timestamp, JSON.stringify(m)]);
    });
    mStmt.free();

    const rStmt = db.prepare("INSERT OR REPLACE INTO rooms (id, data) VALUES (?, ?)");
    serverRooms.forEach((r) => {
      rStmt.run([r.id, JSON.stringify(r)]);
    });
    rStmt.free();

    const newsStmt = db.prepare("INSERT OR REPLACE INTO news (id, data) VALUES (?, ?)");
    serverNews.forEach((n) => {
      newsStmt.run([n.id, JSON.stringify(n)]);
    });
    newsStmt.free();

    const wallStmt = db.prepare("INSERT OR REPLACE INTO wall_posts (id, data) VALUES (?, ?)");
    serverWallPosts.forEach((w) => {
      wallStmt.run([w.id, JSON.stringify(w)]);
    });
    wallStmt.free();

    const nStmt = db.prepare("INSERT OR REPLACE INTO notifications (id, userId, timestamp, data) VALUES (?, ?, ?, ?)");
    serverNotifications.forEach((n) => {
      nStmt.run([n.id, n.userId, n.timestamp, JSON.stringify(n)]);
    });
    nStmt.free();

    const eStmt = db.prepare("INSERT OR REPLACE INTO custom_emojis (id, tag, name, category, data) VALUES (?, ?, ?, ?, ?)");
    serverCustomEmojis.forEach((e) => {
      eStmt.run([e.id, e.tag, e.name, e.category || 'custom', JSON.stringify(e)]);
    });
    eStmt.free();

    saveD1ToDisk();
    console.log("🔄 Successfully reset and re-seeded SQLite D1 database with clean Owner account (المالك) while preserving custom emojis.");
  } catch (err) {
    console.error("Error resetting D1 database:", err);
  }
}

// Initialize SQLite D1 Engine & Load Seed / Persistent Data
async function initD1Database() {
  const SQL = await initSqlJs();

  let loadedSuccessfully = false;
  if (fs.existsSync(DB_FILE)) {
    try {
      const filebuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(filebuffer);
      // Run quick integrity check
      db.exec("SELECT 1;");
      console.log("💾 Loaded existing D1 SQLite database from disk.");
      loadedSuccessfully = true;
    } catch (e) {
      console.warn("Corrupted or incompatible DB file found. Resetting SQLite D1 database:", e);
      try {
        if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
      } catch (_) {}
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log("✨ Initialized new Cloudflare D1 SQLite database.");
  }

  try {
    // Create tables in SQLite D1
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        role TEXT,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        roomId TEXT,
        senderId TEXT,
        timestamp TEXT,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS private_messages (
        id TEXT PRIMARY KEY,
        senderId TEXT,
        receiverId TEXT,
        timestamp TEXT,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS wall_posts (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS friend_requests (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS ip_moderations (
        id TEXT PRIMARY KEY,
        ip TEXT,
        type TEXT,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT,
        timestamp TEXT,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS custom_emojis (
        id TEXT PRIMARY KEY,
        tag TEXT,
        name TEXT,
        category TEXT,
        data TEXT
      );
    `);

    // Check if owner is already present and matches the requested clean state
    const userRows = db.exec("SELECT data FROM users");
    let shouldReset = false;
    if (userRows.length > 0 && userRows[0].values.length > 0) {
      const loadedUsers: User[] = userRows[0].values.map((v) => JSON.parse(v[0] as string));
      // Delete old owner with username 'المالك'
      try {
        db.run("DELETE FROM users WHERE username = 'المالك' OR id = 'user-owner-old'");
      } catch (e) {}

      const hasCleanOwner = loadedUsers.some(u => u.role === 'owner' && (u.username === 'Owner' || u.id === 'user-owner'));
      if (!hasCleanOwner) {
        console.log("🧹 Detected stale owner account. Recreating clean Owner account...");
        const cleanOwner: User = {
          id: 'user-owner',
          username: 'Owner',
          password: 'Owner@2026',
          email: 'owner@chat.ye',
          role: 'owner',
          gender: 'male',
          age: 28,
          avatar: '/default_male.svg',
          wallCover: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1000&q=80',
          statusMessage: '👑 Owner | مرحباً بكم في دردشة عربي المطورة',
          bio: 'حساب المالك الرئيسي والمؤسس للدردشة. يسعدني تواجدكم جميعاً.',
          coins: 1000000,
          likes: 500,
          likedBy: [],
          country: 'اليمن',
          countryFlag: '🇾🇪',
          specialty: 'إدارة وتطوير 💻',
          specialtyCategory: 'tech',
          language: 'العربية 🇸🇦',
          currentRoomId: 'room-general',
          joinedDate: '26/08/2026',
          joinedTimestamp: Date.now(),
          lastSeen: 'الآن',
          lastSeenTimestamp: Date.now(),
          usernameColor: '#f59e0b',
          fontColor: '#fbbf24',
          fontSize: 16,
          isStealth: false,
          privatePrivacy: 'everyone',
          onlineStatus: 'online',
          ip: '197.220.12.89',
          locationMap: 'صنعاء، اليمن',
          friends: [],
          ignores: []
        };
        serverUsers = [cleanOwner, ...loadedUsers.filter(u => u.username !== 'المالك' && u.id !== 'user-owner')];
        saveUserToD1(cleanOwner);
        saveD1ToDisk();
      } else {
        // Purge any mock/dummy users, strip user-system from friends, and retain only real accounts
        const mockUserIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'];
        serverUsers = loadedUsers
          .filter(u => !mockUserIds.includes(u.id) && u.username !== 'المالك')
          .map(u => {
            const cleanJoinedDate = (!u.joinedDate || u.joinedDate === '01/01/2026') ? '26/08/2026' : u.joinedDate;
            if (u.id === 'user-owner' || u.role === 'owner') {
              return {
                ...u,
                username: 'Owner',
                role: 'owner' as const,
                statusMessage: '👑 Owner | مرحباً بكم في دردشة عربي المطورة',
                joinedDate: cleanJoinedDate,
                friends: (u.friends || []).filter(fId => fId !== 'user-system' && fId !== 'system')
              };
            }
            return {
              ...u,
              joinedDate: cleanJoinedDate,
              friends: (u.friends || []).filter(fId => fId !== 'user-system' && fId !== 'system')
            };
          });
        mockUserIds.forEach(id => {
          try {
            db.run("DELETE FROM users WHERE id = ?", [id]);
          } catch (e) {}
        });
        // Resave cleaned users to db
        serverUsers.forEach(saveUserToD1);
        saveD1ToDisk();
      }
    } else {
      shouldReset = true;
    }

    if (shouldReset) {
      resetD1Database();
      return;
    }
  } catch (err) {
    console.error("Database schema or data query error, recovering with clean reset:", err);
    db = new SQL.Database();
    resetD1Database();
    return;
  }

  // 2. Messages - Purge any mock messages from screenshots or initial states
  const mockMsgIds = ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6'];
  const mockSenderIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'];
  try {
    db.run(`DELETE FROM messages WHERE id IN ('msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6') OR senderId IN ('user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8')`);
  } catch (e) {}

  const msgRows = db.exec("SELECT data FROM messages");
  if (msgRows.length > 0 && msgRows[0].values.length > 0) {
    serverMessages = msgRows[0].values
      .map((v) => JSON.parse(v[0] as string))
      .filter((m: Message) => !mockMsgIds.includes(m.id) && !mockSenderIds.includes(m.senderId));
  } else {
    serverMessages = [];
  }

  // 3. Private Messages
  const pMsgRows = db.exec("SELECT data FROM private_messages");
  if (pMsgRows.length > 0 && pMsgRows[0].values.length > 0) {
    serverPrivateMessages = pMsgRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverPrivateMessages = [];
  }

  // 4. Rooms (Purge any fake baseUserCount)
  const roomRows = db.exec("SELECT data FROM rooms");
  if (roomRows.length > 0 && roomRows[0].values.length > 0) {
    const rawRooms: Room[] = roomRows[0].values.map((v) => JSON.parse(v[0] as string));
    serverRooms = rawRooms.map(r => ({ ...r, baseUserCount: undefined }));
  } else {
    serverRooms = [...INITIAL_ROOMS];
    const stmt = db.prepare("INSERT OR REPLACE INTO rooms (id, data) VALUES (?, ?)");
    serverRooms.forEach((r) => {
      stmt.run([r.id, JSON.stringify(r)]);
    });
    stmt.free();
  }

  // 5. Friend Requests
  const frRows = db.exec("SELECT data FROM friend_requests");
  if (frRows.length > 0 && frRows[0].values.length > 0) {
    serverFriendRequests = frRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverFriendRequests = [];
  }

  // 6. IP Moderations
  const ipRows = db.exec("SELECT data FROM ip_moderations");
  if (ipRows.length > 0 && ipRows[0].values.length > 0) {
    serverIPModerations = ipRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverIPModerations = [];
  }
  // Ensure owner IP 197.220.12.89 and Owner account are never kept banned
  serverIPModerations = serverIPModerations.filter(r => r.ip !== '197.220.12.89' && r.targetUsername?.toLowerCase() !== 'owner');

  // 7. Notifications
  const notifRows = db.exec("SELECT data FROM notifications");
  if (notifRows.length > 0 && notifRows[0].values.length > 0) {
    serverNotifications = notifRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverNotifications = [...INITIAL_NOTIFICATIONS];
    const stmt = db.prepare("INSERT OR REPLACE INTO notifications (id, userId, timestamp, data) VALUES (?, ?, ?, ?)");
    serverNotifications.forEach((n) => {
      stmt.run([n.id, n.userId, n.timestamp, JSON.stringify(n)]);
    });
    stmt.free();
  }

  // 8. Site Settings
  const settingsRows = db.exec("SELECT data FROM site_settings WHERE id = 'global'");
  if (settingsRows.length > 0 && settingsRows[0].values.length > 0) {
    serverSiteSettings = { ...INITIAL_SITE_SETTINGS, ...JSON.parse(settingsRows[0].values[0][0] as string) };
  } else {
    serverSiteSettings = { ...INITIAL_SITE_SETTINGS };
    const stmt = db.prepare("INSERT OR REPLACE INTO site_settings (id, data) VALUES ('global', ?)");
    stmt.run([JSON.stringify(serverSiteSettings)]);
    stmt.free();
  }

  // 9. Custom Emojis & Stickers (load from DB and merge with disk backup)
  const backupEmojis = loadEmojisFromDiskBackup();
  let dbEmojis: CustomEmojiItem[] = [];
  const emojiRows = db.exec("SELECT data FROM custom_emojis");
  if (emojiRows.length > 0 && emojiRows[0].values.length > 0) {
    dbEmojis = emojiRows[0].values.map((v) => JSON.parse(v[0] as string));
  }

  // Merge SQLite emojis, disk backup emojis, and initial emojis
  const emojiMap = new Map<string, CustomEmojiItem>();
  INITIAL_CUSTOM_EMOJIS.forEach(e => emojiMap.set(e.id, e));
  dbEmojis.forEach(e => emojiMap.set(e.id, e));
  backupEmojis.forEach(e => emojiMap.set(e.id, e));

  serverCustomEmojis = Array.from(emojiMap.values());
  saveEmojisToDiskBackup(serverCustomEmojis);

  const stmt = db.prepare("INSERT OR REPLACE INTO custom_emojis (id, tag, name, category, data) VALUES (?, ?, ?, ?, ?)");
  serverCustomEmojis.forEach((e) => {
    stmt.run([e.id, e.tag, e.name, e.category || 'custom', JSON.stringify(e)]);
  });
  stmt.free();

  // 10. News
  const newsRows = db.exec("SELECT data FROM news");
  if (newsRows.length > 0 && newsRows[0].values.length > 0) {
    serverNews = newsRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverNews = [...INITIAL_NEWS];
    const nStmt = db.prepare("INSERT OR REPLACE INTO news (id, data) VALUES (?, ?)");
    serverNews.forEach((n) => {
      nStmt.run([n.id, JSON.stringify(n)]);
    });
    nStmt.free();
  }

  // 11. Wall Posts
  const wallRows = db.exec("SELECT data FROM wall_posts");
  if (wallRows.length > 0 && wallRows[0].values.length > 0) {
    serverWallPosts = wallRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverWallPosts = [...INITIAL_WALL_POSTS];
  }

  saveD1ToDisk();
}

// Helper SQL Persistence functions for News & Wall Posts
function saveNewsPostToD1(post: NewsPost) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO news (id, data) VALUES (?, ?)");
    stmt.run([post.id, JSON.stringify(post)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveNewsPost error:", e);
  }
}

function deleteNewsPostFromD1(newsId: string) {
  try {
    db.run("DELETE FROM news WHERE id = ?", [newsId]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 deleteNewsPost error:", e);
  }
}

function saveWallPostToD1(post: WallPost) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO wall_posts (id, data) VALUES (?, ?)");
    stmt.run([post.id, JSON.stringify(post)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveWallPost error:", e);
  }
}

function deleteWallPostFromD1(postId: string) {
  try {
    db.run("DELETE FROM wall_posts WHERE id = ?", [postId]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 deleteWallPost error:", e);
  }
}

// Helper SQL Persistence functions
function saveCustomEmojisToD1(emojis: CustomEmojiItem[]) {
  try {
    saveEmojisToDiskBackup(emojis);
    db.run("DELETE FROM custom_emojis");
    const stmt = db.prepare("INSERT INTO custom_emojis (id, tag, name, category, data) VALUES (?, ?, ?, ?, ?)");
    emojis.forEach((e) => {
      stmt.run([e.id, e.tag, e.name, e.category || 'custom', JSON.stringify(e)]);
    });
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveCustomEmojis error:", e);
  }
}

function saveSingleCustomEmojiToD1(item: CustomEmojiItem) {
  try {
    saveEmojisToDiskBackup(serverCustomEmojis);
    const stmt = db.prepare("INSERT OR REPLACE INTO custom_emojis (id, tag, name, category, data) VALUES (?, ?, ?, ?, ?)");
    stmt.run([item.id, item.tag, item.name, item.category || 'custom', JSON.stringify(item)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveSingleCustomEmoji error:", e);
  }
}

function deleteCustomEmojiFromD1(id: string) {
  try {
    saveEmojisToDiskBackup(serverCustomEmojis);
    db.run("DELETE FROM custom_emojis WHERE id = ?", [id]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 deleteCustomEmoji error:", e);
  }
}
function saveSiteSettingsToD1(settings: SiteSettings) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO site_settings (id, data) VALUES ('global', ?)");
    stmt.run([JSON.stringify(settings)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveSiteSettings error:", e);
  }
}

function saveUserToD1(user: User) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO users (id, username, role, data) VALUES (?, ?, ?, ?)");
    stmt.run([user.id, user.username, user.role, JSON.stringify(user)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveUser error:", e);
  }
}

function saveMessageToD1(msg: Message) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO messages (id, roomId, senderId, timestamp, data) VALUES (?, ?, ?, ?, ?)");
    stmt.run([msg.id, msg.roomId, msg.senderId, msg.timestamp, JSON.stringify(msg)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveMessage error:", e);
  }
}

function savePrivateMessageToD1(pMsg: PrivateMessage) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO private_messages (id, senderId, receiverId, timestamp, data) VALUES (?, ?, ?, ?, ?)");
    stmt.run([pMsg.id, pMsg.senderId, pMsg.receiverId, pMsg.timestamp, JSON.stringify(pMsg)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 savePrivateMessage error:", e);
  }
}

async function deleteMessageFromD1(messageId: string): Promise<void> {
  if (!db) {
    throw new Error("Database not initialized");
  }
  try {
    db.run("DELETE FROM messages WHERE id = ?", [messageId]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 deleteMessage error:", e);
    throw e;
  }
}

async function clearRoomFromD1(roomId: string): Promise<void> {
  if (!db) {
    throw new Error("Database not initialized");
  }
  try {
    db.run("DELETE FROM messages WHERE roomId = ?", [roomId]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 clearRoom error:", e);
    throw e;
  }
}

function saveRoomsToD1(rooms: Room[]) {
  try {
    db.run("DELETE FROM rooms");
    const stmt = db.prepare("INSERT INTO rooms (id, data) VALUES (?, ?)");
    rooms.forEach((r) => stmt.run([r.id, JSON.stringify(r)]));
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveRooms error:", e);
  }
}

function saveIPModerationToD1(record: IPModerationRecord) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO ip_moderations (id, ip, type, data) VALUES (?, ?, ?, ?)");
    stmt.run([record.id, record.ip, record.type, JSON.stringify(record)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveIPModeration error:", e);
  }
}

function deleteIPModerationFromD1(idOrIp: string) {
  try {
    db.run("DELETE FROM ip_moderations WHERE id = ? OR ip = ?", [idOrIp, idOrIp]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 deleteIPModeration error:", e);
  }
}

function saveNotificationToD1(notif: Notification) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO notifications (id, userId, timestamp, data) VALUES (?, ?, ?, ?)");
    stmt.run([notif.id, notif.userId, notif.timestamp, JSON.stringify(notif)]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveNotification error:", e);
  }
}

function deleteNotificationFromD1(notifId: string) {
  try {
    db.run("DELETE FROM notifications WHERE id = ?", [notifId]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 deleteNotification error:", e);
  }
}

function markNotificationsReadInD1(userId: string) {
  try {
    serverNotifications = serverNotifications.map((n) => (n.userId === userId ? { ...n, isRead: true } : n));
    db.run("DELETE FROM notifications WHERE userId = ?", [userId]);
    const stmt = db.prepare("INSERT INTO notifications (id, userId, timestamp, data) VALUES (?, ?, ?, ?)");
    serverNotifications
      .filter((n) => n.userId === userId)
      .forEach((n) => stmt.run([n.id, n.userId, n.timestamp, JSON.stringify(n)]));
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 markNotificationsRead error:", e);
  }
}

// REST Endpoints for D1 SQLite DB
app.post("/api/d1/reset", (req, res) => {
  resetD1Database();
  broadcast({ type: "SYNC_USERS", payload: serverUsers });
  broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
  broadcast({ type: "SYNC_MESSAGES", payload: serverMessages });
  broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });
  res.json({
    success: true,
    message: "تم تصفير قاعدة البيانات بنجاح وإنشاء حساب المالك",
    owner: {
      username: "المالك",
      role: "owner"
    }
  });
});

app.get("/api/d1/health", (req, res) => {
  res.json({
    status: "online",
    engine: "Cloudflare D1 (SQLite Engine)",
    dbFile: DB_FILE,
    counts: {
      users: serverUsers.length,
      messages: serverMessages.length,
      privateMessages: serverPrivateMessages.length,
      rooms: serverRooms.length,
      ipModerations: serverIPModerations.length,
      notifications: serverNotifications.length,
    },
  });
});

app.get("/api/d1/users", (req, res) => {
  res.json({ users: serverUsers });
});

app.get("/api/d1/messages", (req, res) => {
  res.json({ messages: serverMessages });
});

app.post("/api/messages/send", (req, res) => {
  const { message } = req.body || {};
  if (message && message.id) {
    if (!serverMessages.some((m) => m.id === message.id)) {
      serverMessages.push(message);
      saveMessageToD1(message);
      broadcast({ type: "NEW_MESSAGE", payload: message });
    }
    return res.json({ success: true, message });
  }
  res.status(400).json({ success: false, error: "Invalid message" });
});

app.post("/api/messages/delete", async (req, res) => {
  const { messageId, userId, userRole } = req.body || {};
  if (!messageId) {
    return res.status(400).json({ success: false, error: "Missing messageId" });
  }

  // 4. Server-side permission check
  const targetMsg = serverMessages.find((m) => m.id === messageId);
  if (targetMsg && userId) {
    const isSender = targetMsg.senderId === userId;
    const foundUser = serverUsers.find((u) => u.id === userId);
    const effectiveRole = foundUser ? foundUser.role : userRole;
    const isStaff = ["owner", "admin", "management", "moderator"].includes(effectiveRole || "");

    if (!isSender && !isStaff) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized: You do not have permission to delete this message"
      });
    }
  }

  // 1. Database first: await deletion from persistent storage
  try {
    await deleteMessageFromD1(messageId);

    serverMessages = serverMessages.filter((m) => m.id !== messageId);

    broadcast({
      type: "MESSAGE_DELETED",
      payload: { messageId }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Database delete failed:", error);
    return res.status(500).json({
      success: false,
      error: "Database delete failed"
    });
  }
});

app.post("/api/messages/clear", async (req, res) => {
  const { roomId, userId, userRole } = req.body || {};
  if (!roomId) {
    return res.status(400).json({ success: false, error: "Missing roomId" });
  }

  if (userId) {
    const foundUser = serverUsers.find((u) => u.id === userId);
    const effectiveRole = foundUser ? foundUser.role : userRole;
    const isAllowed = ["owner", "admin", "management"].includes(effectiveRole || "");
    if (!isAllowed) {
      return res.status(403).json({ success: false, error: "Unauthorized to clear room chat" });
    }
  }

  try {
    await clearRoomFromD1(roomId);
    serverMessages = serverMessages.filter((m) => m.roomId !== roomId);
    broadcast({ type: "CHAT_CLEARED", payload: { roomId } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Database clearRoom failed:", error);
    return res.status(500).json({
      success: false,
      error: "Database clear failed"
    });
  }
});

app.get("/api/d1/private-messages", (req, res) => {
  res.json({ privateMessages: serverPrivateMessages });
});

app.post("/api/private-messages/send", (req, res) => {
  const { privateMessage } = req.body || {};
  if (privateMessage && privateMessage.id) {
    if (!serverPrivateMessages.some((pm) => pm.id === privateMessage.id)) {
      serverPrivateMessages.push(privateMessage);
      savePrivateMessageToD1(privateMessage);
      broadcast({ type: "NEW_PRIVATE_MESSAGE", payload: privateMessage });
    }
    return res.json({ success: true, privateMessage });
  }
  res.status(400).json({ success: false, error: "Invalid private message" });
});

app.post("/api/private/clear-user", (req, res) => {
  const { userId } = req.body || {};
  if (userId) {
    serverPrivateMessages = serverPrivateMessages.filter(
      pm => pm.senderId !== userId && pm.receiverId !== userId
    );
    try {
      db.run("DELETE FROM private_messages WHERE senderId = ? OR receiverId = ?", [userId, userId]);
      saveD1ToDisk();
    } catch (e) {
      console.error("Error clearing user PMs from D1 via REST:", e);
    }
    broadcast({ type: "SYNC_PRIVATE_MESSAGES", payload: serverPrivateMessages });
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, error: "Missing userId" });
});

app.get("/api/d1/notifications", (req, res) => {
  res.json({ notifications: serverNotifications });
});

app.get("/api/d1/ip-moderations", (req, res) => {
  res.json({ ipModerations: serverIPModerations });
});

// Endpoint to check client IP status for ban/kick/mute
app.get("/api/ip/status", (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();

  // Find active records for this IP
  const activeRecords = serverIPModerations.filter(rec => {
    if (rec.ip !== ip && rec.ip !== 'all') return false;
    if (rec.type === 'ban') return true;
    if (rec.expiresAt) {
      return new Date(rec.expiresAt).getTime() > now;
    }
    return true;
  });

  const isBanned = activeRecords.some(r => r.type === 'ban');
  const isKicked = activeRecords.some(r => r.type === 'kick');
  const isMuted = activeRecords.some(r => r.type === 'mute');

  res.json({
    ip,
    isBanned,
    isKicked,
    isMuted,
    bannedRecord: activeRecords.find(r => r.type === 'ban') || null,
    kickedRecord: activeRecords.find(r => r.type === 'kick') || null,
    mutedRecord: activeRecords.find(r => r.type === 'mute') || null,
    activeRecords,
    allModerations: serverIPModerations,
  });
});

// Endpoint to apply / remove IP moderations directly
app.post("/api/ip/action", (req, res) => {
  const { action, record, idOrIp } = req.body || {};

  if (action === "ADD" && record && record.ip) {
    const existingIdx = serverIPModerations.findIndex(r => r.id === record.id);
    if (existingIdx !== -1) {
      serverIPModerations[existingIdx] = record;
    } else {
      serverIPModerations.push(record);
    }
    saveIPModerationToD1(record);
    broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });
  } else if (action === "REMOVE" && idOrIp) {
    serverIPModerations = serverIPModerations.filter(r => r.id !== idOrIp && r.ip !== idOrIp);
    deleteIPModerationFromD1(idOrIp);
    broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });
  }

  res.json({ success: true, ipModerations: serverIPModerations });
});

// Endpoint to completely unban current user device and IP
app.post("/api/ip/unban-my-device", (req, res) => {
  const targetIp = (req.body && req.body.ip) ? req.body.ip : '197.220.12.89';
  const deviceId = req.body ? req.body.deviceId : undefined;

  serverIPModerations = serverIPModerations.filter(r => 
    r.ip !== targetIp && 
    r.ip !== '197.220.12.89' && 
    (!deviceId || (r.deviceId !== deviceId && r.id !== deviceId))
  );
  deleteIPModerationFromD1(targetIp);
  deleteIPModerationFromD1('197.220.12.89');
  if (deviceId) {
    deleteIPModerationFromD1(deviceId);
  }

  // Also remove from serverSiteSettings
  if (serverSiteSettings.blockedDevices) {
    serverSiteSettings.blockedDevices = serverSiteSettings.blockedDevices.filter(d => (!deviceId || (d.id !== deviceId && d.token !== deviceId)));
  }
  if (serverSiteSettings.bannedIps) {
    serverSiteSettings.bannedIps = serverSiteSettings.bannedIps.filter(ip => ip !== targetIp && ip !== '197.220.12.89');
  }
  saveSiteSettingsToD1(serverSiteSettings);

  // Unban user in memory & DB if marked
  serverUsers.forEach(u => {
    if (u.username.toLowerCase() === 'owner' || u.ip === targetIp || u.ip === '197.220.12.89' || (deviceId && u.deviceId === deviceId)) {
      u.isBanned = false;
      saveUserToD1(u);
    }
  });

  broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });
  broadcast({ type: "SYNC_SITE_SETTINGS", payload: serverSiteSettings });
  broadcast({ type: "SYNC_USERS", payload: serverUsers });

  res.json({ success: true, message: "Device and IP unbanned successfully" });
});

// History pagination endpoint: allows authorized ranks (> member) to load older messages
app.get("/api/messages/history", (req, res) => {
  const roomId = (req.query.roomId as string) || "room-general";
  const beforeTimestamp = req.query.beforeTimestamp as string;
  const limit = Math.min(100, Math.max(10, parseInt((req.query.limit as string) || "25", 10)));
  const role = (req.query.role as string) || "";

  // Check role: only roles above 'member' (vip, moderator, management, admin, owner, system) can view old message history
  const allowedRoles = ["vip", "moderator", "management", "admin", "owner", "system"];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      error: "عذراً، عرض أرشيف الرسائل القديمة متاح للرتب المميزة والإدارية فقط (فوق رتبة عضو مسجل)"
    });
  }

  let msgs = serverMessages.filter((m) => m.roomId === roomId);
  if (beforeTimestamp) {
    const beforeTime = new Date(beforeTimestamp).getTime();
    msgs = msgs.filter((m) => new Date(m.timestamp).getTime() < beforeTime);
  }

  // Sort descending by time to pick the closest older messages
  msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const batch = msgs.slice(0, limit);
  // Restore ascending chronological order
  batch.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.json({
    success: true,
    messages: batch,
    hasMore: msgs.length > limit,
    totalOlder: msgs.length
  });
});

// REST Endpoint to update user profile, avatar, username, coins, roles
app.post("/api/users/update", (req, res) => {
  const { user } = req.body || {};
  if (user && user.id) {
    const existingIdx = serverUsers.findIndex((u) => u.id === user.id);
    if (existingIdx !== -1) {
      serverUsers[existingIdx] = { ...serverUsers[existingIdx], ...user };
    } else {
      serverUsers.push(user);
    }
    const updated = serverUsers.find((u) => u.id === user.id);
    if (updated) {
      saveUserToD1(updated);
    }
    broadcast({ type: "USER_UPDATED", payload: user });
    broadcast({ type: "SYNC_USERS", payload: serverUsers });
    return res.json({ success: true, user: updated });
  }
  res.status(400).json({ success: false, error: "Invalid user data" });
});

// REST Endpoint to delete user account
app.post("/api/users/delete", (req, res) => {
  const { userId, requesterId, requesterRole } = req.body || {};
  if (!userId) {
    return res.status(400).json({ success: false, error: "Missing userId" });
  }

  const target = serverUsers.find((u) => u.id === userId);
  if (target && (target.role === 'owner' || target.id === 'user-owner' || target.is_super_admin)) {
    return res.status(403).json({ success: false, error: "Cannot delete owner or Super Admin account" });
  }

  // Server authorization check:
  if (requesterId && requesterId !== userId) {
    const foundRequester = serverUsers.find(u => u.id === requesterId);
    const role = foundRequester ? foundRequester.role : requesterRole;
    if (!['owner', 'admin', 'management'].includes(role || '')) {
      return res.status(403).json({ success: false, error: "Unauthorized to delete user" });
    }
  }

  handleUserDeleted(userId);
  return res.json({ success: true });
});

// REST Endpoint to handle user logout
app.post("/api/users/logout", (req, res) => {
  const { userId, isVisitor } = req.body || {};
  if (userId) {
    handleUserLeaving(userId, !!isVisitor);
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, error: "Missing userId" });
});

// REST Endpoint to update site settings
app.post("/api/settings/update", (req, res) => {
  const { settings } = req.body || {};
  if (settings) {
    serverSiteSettings = { ...serverSiteSettings, ...settings };
    saveSiteSettingsToD1(serverSiteSettings);
    broadcast({ type: "SYNC_SETTINGS", payload: serverSiteSettings });
    return res.json({ success: true, settings: serverSiteSettings });
  }
  res.status(400).json({ success: false, error: "Invalid settings" });
});

// REST Endpoint to clean up inactive users based on owner settings
app.post("/api/admin/cleanup-inactive-users", (req, res) => {
  try {
    const timeoutMinutes = Number(serverSiteSettings?.userInactivityTimeoutMinutes) || 15;
    const cutoff = Date.now() - (timeoutMinutes * 60 * 1000);
    let cleanedCount = 0;

    serverUsers = serverUsers.map(u => {
      if (u.onlineStatus === 'online' && u.lastSeenTimestamp && u.lastSeenTimestamp < cutoff) {
        cleanedCount++;
        return {
          ...u,
          onlineStatus: 'offline',
          isOnline: false
        };
      }
      return u;
    });

    if (cleanedCount > 0) {
      serverUsers.forEach(saveUserToD1);
      broadcast({ type: "SYNC_USERS", payload: serverUsers });
      broadcast({ type: "UPDATE_ONLINE_USERS", payload: serverUsers.filter((u) => u.onlineStatus !== 'offline') });
    }

    return res.json({ success: true, cleanedCount, timeoutMinutes });
  } catch (err: any) {
    console.error("Error during cleanup-inactive-users:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Hourly background scheduled cleanup for inactive users
setInterval(() => {
  try {
    const timeoutMinutes = Number(serverSiteSettings?.userInactivityTimeoutMinutes) || 15;
    const cutoff = Date.now() - (timeoutMinutes * 60 * 1000);
    let count = 0;
    serverUsers = serverUsers.map(u => {
      if (u.onlineStatus === 'online' && u.lastSeenTimestamp && u.lastSeenTimestamp < cutoff) {
        count++;
        return { ...u, onlineStatus: 'offline', isOnline: false };
      }
      return u;
    });
    if (count > 0) {
      serverUsers.forEach(saveUserToD1);
      broadcast({ type: "SYNC_USERS", payload: serverUsers });
      broadcast({ type: "UPDATE_ONLINE_USERS", payload: serverUsers.filter((u) => u.onlineStatus !== 'offline') });
      console.log(`[Scheduled Hourly Cleanup] Cleaned up ${count} inactive users.`);
    }
  } catch (e) {
    console.error("Scheduled cleanup error:", e);
  }
}, 60 * 60 * 1000);

// GET /sitemap.xml dynamic generator
app.get("/sitemap.xml", (req, res) => {
  const host = req.get("host") || "yemen-chat.app";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;
  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.00</priority>
  </url>
  <url>
    <loc>${baseUrl}/rooms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.90</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms-of-service</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy-policy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>
  <url>
    <loc>${baseUrl}/chat-rules</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.60</priority>
  </url>
  <url>
    <loc>${baseUrl}/about-us</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.60</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact-us</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.60</priority>
  </url>
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

// GET /robots.txt
app.get("/robots.txt", (req, res) => {
  const host = req.get("host") || "yemen-chat.app";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const sitemapUrl = `${protocol}://${host}/sitemap.xml`;

  res.header("Content-Type", "text/plain");
  res.send(`User-agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`);
});

// REST Endpoint to update rooms
app.post("/api/rooms/update", (req, res) => {
  const { rooms } = req.body || {};
  if (Array.isArray(rooms)) {
    serverRooms = rooms;
    saveRoomsToD1(serverRooms);
    broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
    return res.json({ success: true, rooms: serverRooms });
  }
  res.status(400).json({ success: false, error: "Invalid rooms data" });
});

// REST Endpoints for Emojis & Stickers
app.get("/api/emojis/list", (req, res) => {
  res.json({ emojis: serverCustomEmojis });
});

app.post("/api/emojis/sync", (req, res) => {
  const { emojis } = req.body || {};
  if (Array.isArray(emojis)) {
    serverCustomEmojis = emojis;
    saveCustomEmojisToD1(serverCustomEmojis);
    broadcast({ type: "SYNC_CUSTOM_EMOJIS", payload: serverCustomEmojis });
    return res.json({ success: true, count: serverCustomEmojis.length });
  }
  res.status(400).json({ success: false, error: "Invalid emojis data" });
});

app.post("/api/emojis/add", (req, res) => {
  const { emoji } = req.body || {};
  if (emoji && emoji.id) {
    const idx = serverCustomEmojis.findIndex(e => e.id === emoji.id);
    if (idx !== -1) {
      serverCustomEmojis[idx] = emoji;
    } else {
      serverCustomEmojis.push(emoji);
    }
    saveSingleCustomEmojiToD1(emoji);
    broadcast({ type: "SYNC_CUSTOM_EMOJIS", payload: serverCustomEmojis });
    return res.json({ success: true, emoji });
  }
  res.status(400).json({ success: false, error: "Invalid emoji item" });
});

app.post("/api/emojis/delete", (req, res) => {
  const { id } = req.body || {};
  if (id) {
    serverCustomEmojis = serverCustomEmojis.filter(e => e.id !== id);
    deleteCustomEmojiFromD1(id);
    broadcast({ type: "SYNC_CUSTOM_EMOJIS", payload: serverCustomEmojis });
    return res.json({ success: true });
  }
  res.status(400).json({ success: false, error: "Missing emoji id" });
});

// WebSocket Server on /ws
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(data: any, ignoreSocket?: WebSocket) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== ignoreSocket) {
      client.send(payload);
    }
  });
}

function handleUserLeaving(userId: string, isVisitor?: boolean) {
  if (!userId) return;
  const user = serverUsers.find((u) => u.id === userId);
  const isVis = isVisitor || (user && (user.role === 'visitor' || user.id.startsWith('visitor-')));

  if (isVis) {
    // 1. Temporary visitor: remove immediately from in-memory and database
    serverUsers = serverUsers.filter((u) => u.id !== userId);
    try {
      db.run("DELETE FROM users WHERE id = ?", [userId]);
      saveD1ToDisk();
    } catch (e) {
      console.error("D1 delete visitor error:", e);
    }
  } else {
    // 2. Registered member: mark offline, update lastSeen, save to database
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes} ${day}/${month}/${year}`;
    const nowTimestamp = Date.now();

    serverUsers = serverUsers.map((u) => {
      if (u.id === userId) {
        const updated = {
          ...u,
          onlineStatus: "offline" as const,
          isOnline: false,
          lastSeen: formattedTime,
          lastSeenTimestamp: nowTimestamp
        };
        saveUserToD1(updated);
        return updated;
      }
      return u;
    });
  }

  // 3. Broadcast departure and authoritative updated presence lists
  broadcast({ type: "USER_LEFT", payload: { userId } });
  broadcast({ type: "SYNC_USERS", payload: serverUsers });
  broadcast({ type: "UPDATE_ONLINE_USERS", payload: serverUsers.filter((u) => u.onlineStatus !== 'offline') });
}

function handleUserDeleted(userId: string) {
  if (!userId) return;
  // 1. Database first: delete from SQLite D1
  try {
    db.run("DELETE FROM users WHERE id = ?", [userId]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 delete user error:", e);
  }

  // 2. Remove from server memory
  serverUsers = serverUsers.filter((u) => u.id !== userId);

  // 3. Broadcast events to all clients
  broadcast({ type: "USER_DELETED", payload: { userId } });
  broadcast({ type: "SYNC_USERS", payload: serverUsers });
  broadcast({ type: "UPDATE_ONLINE_USERS", payload: serverUsers.filter((u) => u.onlineStatus !== 'offline') });
}

wss.on("connection", (ws: WebSocket) => {
  let currentUserId: string | null = null;

  // Initial sync with client
  ws.send(
    JSON.stringify({
      type: "INIT_STATE",
      payload: {
        users: serverUsers,
        messages: serverMessages,
        privateMessages: serverPrivateMessages,
        friendRequests: serverFriendRequests,
        rooms: serverRooms,
        ipModerations: serverIPModerations,
        notifications: serverNotifications,
        customEmojis: serverCustomEmojis,
        news: serverNews,
        wallPosts: serverWallPosts,
        siteSettings: serverSiteSettings,
      },
    })
  );

  ws.on("message", async (rawMessage: Buffer | string) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      const { type, payload } = data;

      switch (type) {
        case "JOIN_USER": {
          const user: User = payload?.user;
          if (user) {
            currentUserId = user.id;
            const existingIdx = serverUsers.findIndex((u) => u.id === user.id);
            const dbUser = existingIdx !== -1 ? serverUsers[existingIdx] : null;

            const updatedUser: User = dbUser
              ? {
                  ...user,
                  username: dbUser.username || user.username,
                  avatar: dbUser.avatar !== undefined ? dbUser.avatar : user.avatar,
                  wallCover: dbUser.wallCover !== undefined ? dbUser.wallCover : user.wallCover,
                  bio: dbUser.bio || user.bio,
                  statusMessage: dbUser.statusMessage || user.statusMessage,
                  role: dbUser.role || user.role,
                  currentRoomId: user.currentRoomId || dbUser.currentRoomId || 'room-general',
                  onlineStatus: "online" as const,
                  isOnline: true,
                  lastSeen: "الآن",
                  lastSeenTimestamp: Date.now(),
                }
              : {
                  ...user,
                  currentRoomId: user.currentRoomId || 'room-general',
                  onlineStatus: "online" as const,
                  isOnline: true,
                  lastSeen: "الآن",
                  lastSeenTimestamp: Date.now(),
                };

            if (existingIdx !== -1) {
              serverUsers[existingIdx] = updatedUser;
            } else {
              serverUsers.push(updatedUser);
            }

            saveUserToD1(updatedUser);
            broadcast({ type: "SYNC_USERS", payload: serverUsers });
            broadcast({ type: "UPDATE_ONLINE_USERS", payload: serverUsers.filter((u) => u.onlineStatus !== 'offline') });
            ws.send(JSON.stringify({ type: "USER_UPDATED", payload: updatedUser }));
          }
          break;
        }

        case "USER_LOGOUT": {
          const { userId, isVisitor } = payload || {};
          if (userId) {
            handleUserLeaving(userId, isVisitor);
            if (currentUserId === userId) {
              currentUserId = null;
            }
          }
          break;
        }

        case "SEND_MESSAGE": {
          const msg: Message = payload;
          if (msg && !serverMessages.some((m) => m.id === msg.id)) {
            const senderUserId = msg.senderId;
            const sender = serverUsers.find((u) => u.id === senderUserId);
            const targetRoom = serverRooms.find((r) => r.id === msg.roomId);
            const isMutedInRoom = targetRoom && Array.isArray(targetRoom.mutedUsers) && targetRoom.mutedUsers.includes(senderUserId);
            const isKickedFromRoom = targetRoom && Array.isArray(targetRoom.kickedUsers) && targetRoom.kickedUsers.includes(senderUserId);

            // Block message if user is globally muted, room-muted, or kicked from the room
            if (sender?.isMuted || isMutedInRoom || isKickedFromRoom) {
              console.warn(`[MSG_BLOCKED] User ${senderUserId} is muted/kicked from room ${msg.roomId}`);
              break;
            }

            serverMessages.push(msg);
            saveMessageToD1(msg);
            broadcast({ type: "NEW_MESSAGE", payload: msg });
          }
          break;
        }

        case "SEND_PRIVATE_MESSAGE": {
          const pMsg: PrivateMessage = payload;
          if (pMsg && !serverPrivateMessages.some((pm) => pm.id === pMsg.id)) {
            serverPrivateMessages.push(pMsg);
            savePrivateMessageToD1(pMsg);
            broadcast({ type: "NEW_PRIVATE_MESSAGE", payload: pMsg });
          }
          break;
        }

        case "UPDATE_USER": {
          const updatedUser: User = payload;
          if (updatedUser?.id) {
            serverUsers = serverUsers.map((u) =>
              u.id === updatedUser.id ? { ...u, ...updatedUser } : u
            );
            const found = serverUsers.find((u) => u.id === updatedUser.id);
            if (found) {
              saveUserToD1(found);
            }
            broadcast({ type: "USER_UPDATED", payload: updatedUser });
            broadcast({ type: "SYNC_USERS", payload: serverUsers });
          }
          break;
        }

        case "CHANGE_ROOM": {
          const { userId, fromRoomId, toRoomId } = payload || {};
          if (userId && toRoomId) {
            serverUsers = serverUsers.map((u) =>
              u.id === userId ? { ...u, currentRoomId: toRoomId, onlineStatus: "online" as const, lastSeen: "الآن" } : u
            );
            const found = serverUsers.find((u) => u.id === userId);
            if (found) {
               saveUserToD1(found);
            }
            broadcast({ type: "USER_ROOM_CHANGED", payload: { userId, fromRoomId, toRoomId } });
            broadcast({ type: "SYNC_USERS", payload: serverUsers });
          }
          break;
        }

        case "SYNC_CUSTOM_EMOJIS": {
          if (Array.isArray(payload)) {
            serverCustomEmojis = payload;
            saveCustomEmojisToD1(serverCustomEmojis);
            broadcast({ type: "SYNC_CUSTOM_EMOJIS", payload: serverCustomEmojis });
          }
          break;
        }

        case "ADD_CUSTOM_EMOJI": {
          const emoji: CustomEmojiItem = payload;
          if (emoji && emoji.id) {
            const idx = serverCustomEmojis.findIndex((e) => e.id === emoji.id);
            if (idx !== -1) {
              serverCustomEmojis[idx] = emoji;
            } else {
              serverCustomEmojis.push(emoji);
            }
            saveSingleCustomEmojiToD1(emoji);
            broadcast({ type: "SYNC_CUSTOM_EMOJIS", payload: serverCustomEmojis });
          }
          break;
        }

        case "DELETE_CUSTOM_EMOJI": {
          const { id } = payload || {};
          if (id) {
            serverCustomEmojis = serverCustomEmojis.filter((e) => e.id !== id);
            deleteCustomEmojiFromD1(id);
            broadcast({ type: "SYNC_CUSTOM_EMOJIS", payload: serverCustomEmojis });
          }
          break;
        }

        case "CLEAR_CUSTOM_EMOJIS": {
          serverCustomEmojis = [];
          saveCustomEmojisToD1([]);
          broadcast({ type: "SYNC_CUSTOM_EMOJIS", payload: [] });
          break;
        }

        case "DELETE_MESSAGE": {
          const { messageId } = payload || {};
          if (messageId) {
            try {
              await deleteMessageFromD1(messageId);
              serverMessages = serverMessages.filter((m) => m.id !== messageId);
              broadcast({ type: "MESSAGE_DELETED", payload: { messageId } });
            } catch (err) {
              console.error("WebSocket deleteMessage failed:", err);
            }
          }
          break;
        }

        case "CLEAR_CHAT": {
          const { roomId } = payload || {};
          if (roomId) {
            serverMessages = serverMessages.filter((m) => m.roomId !== roomId);
            clearRoomFromD1(roomId);
            broadcast({ type: "CHAT_CLEARED", payload: { roomId } });
          }
          break;
        }

        case "UPDATE_ROOMS": {
          if (Array.isArray(payload)) {
            serverRooms = payload;
            saveRoomsToD1(serverRooms);
            broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
          }
          break;
        }

        case "ROOM_KICK_EVENT": {
          const { roomId, userId, targetRoomName, fallbackRoomId } = payload || {};
          if (roomId && userId) {
            const fallback = fallbackRoomId || 'room-general';
            serverUsers = serverUsers.map(u => {
              if (u.id === userId && (u.currentRoomId === roomId || !u.currentRoomId)) {
                const updated = { ...u, currentRoomId: fallback };
                saveUserToD1(updated);
                return updated;
              }
              return u;
            });
            serverRooms = serverRooms.map(r => {
              if (r.id === roomId) {
                const currentKicked = Array.isArray(r.kickedUsers) ? r.kickedUsers : [];
                if (!currentKicked.includes(userId)) {
                  return { ...r, kickedUsers: [...currentKicked, userId] };
                }
              }
              return r;
            });
            saveRoomsToD1(serverRooms);
            broadcast({ type: "ROOM_KICKED", payload: { roomId, userId, targetRoomName, fallbackRoomId: fallback } });
            broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
            broadcast({ type: "SYNC_USERS", payload: serverUsers });
          }
          break;
        }

        case "ROOM_MUTE_EVENT": {
          const { roomId, userId, targetRoomName } = payload || {};
          if (roomId && userId) {
            serverRooms = serverRooms.map(r => {
              if (r.id === roomId) {
                const currentMuted = Array.isArray(r.mutedUsers) ? r.mutedUsers : [];
                if (!currentMuted.includes(userId)) {
                  return { ...r, mutedUsers: [...currentMuted, userId] };
                }
              }
              return r;
            });
            saveRoomsToD1(serverRooms);
            broadcast({ type: "ROOM_MUTED", payload: { roomId, userId, targetRoomName } });
            broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
          }
          break;
        }

        case "ROOM_UNMUTE_EVENT": {
          const { roomId, userId } = payload || {};
          if (roomId && userId) {
            serverRooms = serverRooms.map(r => {
              if (r.id === roomId) {
                const currentMuted = Array.isArray(r.mutedUsers) ? r.mutedUsers : [];
                return { ...r, mutedUsers: currentMuted.filter(uid => uid !== userId) };
              }
              return r;
            });
            saveRoomsToD1(serverRooms);
            broadcast({ type: "ROOM_UNMUTED", payload: { roomId, userId } });
            broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
          }
          break;
        }

        case "ROOM_UNKICK_EVENT": {
          const { roomId, userId } = payload || {};
          if (roomId && userId) {
            serverRooms = serverRooms.map(r => {
              if (r.id === roomId) {
                const currentKicked = Array.isArray(r.kickedUsers) ? r.kickedUsers : [];
                return { ...r, kickedUsers: currentKicked.filter(uid => uid !== userId) };
              }
              return r;
            });
            saveRoomsToD1(serverRooms);
            broadcast({ type: "ROOM_UNKICKED", payload: { roomId, userId } });
            broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
          }
          break;
        }

        case "REACT_MESSAGE": {
          const { messageId, reactions } = payload || {};
          if (messageId && reactions) {
            serverMessages = serverMessages.map(m => m.id === messageId ? { ...m, reactions } : m);
            const foundMsg = serverMessages.find(m => m.id === messageId);
            if (foundMsg) {
              saveMessageToD1(foundMsg);
            }
            broadcast({ type: "MESSAGE_REACTION_UPDATED", payload: { messageId, reactions } });
          }
          break;
        }

        case "DELETE_PRIVATE_MESSAGES": {
          const { userId1, userId2 } = payload || {};
          if (userId1 && userId2) {
            serverPrivateMessages = serverPrivateMessages.filter(
              pm => !( (pm.senderId === userId1 && pm.receiverId === userId2) || (pm.senderId === userId2 && pm.receiverId === userId1) )
            );
            try {
              db.run("DELETE FROM private_messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)", [userId1, userId2, userId2, userId1]);
              saveD1ToDisk();
            } catch (e) {
              console.error("Error deleting PMs from D1:", e);
            }
            broadcast({ type: "PRIVATE_MESSAGES_DELETED", payload: { userId1, userId2 } });
          }
          break;
        }

        case "CLEAR_USER_PRIVATE_MESSAGES": {
          const { userId } = payload || {};
          if (userId) {
            serverPrivateMessages = serverPrivateMessages.filter(
              pm => pm.senderId !== userId && pm.receiverId !== userId
            );
            try {
              db.run("DELETE FROM private_messages WHERE senderId = ? OR receiverId = ?", [userId, userId]);
              saveD1ToDisk();
            } catch (e) {
              console.error("Error clearing user PMs from D1:", e);
            }
            broadcast({ type: "SYNC_PRIVATE_MESSAGES", payload: serverPrivateMessages });
          }
          break;
        }

        case "MARK_PRIVATE_READ": {
          const { senderId, receiverId } = payload || {};
          if (senderId && receiverId) {
            serverPrivateMessages = serverPrivateMessages.map(pm => {
              if (pm.senderId === senderId && pm.receiverId === receiverId) {
                return { ...pm, isRead: true };
              }
              return pm;
            });
            try {
              // Update all matching private messages in D1
              serverPrivateMessages.forEach(pm => {
                if (pm.senderId === senderId && pm.receiverId === receiverId) {
                  const stmt = db.prepare("INSERT OR REPLACE INTO private_messages (id, senderId, receiverId, timestamp, data) VALUES (?, ?, ?, ?, ?)");
                  stmt.run([pm.id, pm.senderId, pm.receiverId, pm.timestamp, JSON.stringify(pm)]);
                  stmt.free();
                }
              });
              saveD1ToDisk();
            } catch (e) {
              console.error("Error marking PMs read in D1:", e);
            }
            broadcast({ type: "PRIVATE_MESSAGES_READ", payload: { senderId, receiverId } });
          }
          break;
        }

        case "SEND_FRIEND_REQUEST": {
          const req: FriendRequest = payload;
          if (
            req &&
            req.receiverId !== 'user-system' &&
            req.receiverId !== 'system' &&
            req.senderId !== 'user-system' &&
            req.senderId !== 'system' &&
            !serverFriendRequests.some(r => r.id === req.id)
          ) {
            serverFriendRequests.push(req);
            try {
              const stmt = db.prepare("INSERT OR REPLACE INTO friend_requests (id, data) VALUES (?, ?)");
              stmt.run([req.id, JSON.stringify(req)]);
              stmt.free();
              saveD1ToDisk();
            } catch (e) {
              console.error("Error saving friend request to D1:", e);
            }
            broadcast({ type: "NEW_FRIEND_REQUEST", payload: req });
          }
          break;
        }

        case "RESPOND_FRIEND_REQUEST": {
          const { requestId } = payload || {};
          if (requestId) {
            serverFriendRequests = serverFriendRequests.filter(r => r.id !== requestId);
            try {
              db.run("DELETE FROM friend_requests WHERE id = ?", [requestId]);
              saveD1ToDisk();
            } catch (e) {
              console.error("Error deleting friend request from D1:", e);
            }
            broadcast({ type: "FRIEND_REQUEST_RESPONDED", payload: { requestId } });
          }
          break;
        }

        case "USER_TYPING": {
          const { userId, username, roomId, isTyping } = payload || {};
          broadcast({ type: "TYPING_STATUS", payload: { userId, username, roomId, isTyping } }, ws);
          break;
        }

        case "BROADCAST_AUDIO_ALERT": {
          const { title, message, soundType, senderName } = payload || {};
          broadcast({
            type: "BROADCAST_AUDIO_ALERT",
            payload: {
              title: title || "تنبيه عام من الإدارة 📢",
              message: message || "إشعار صوتي وإداري عام لجميع المتصلين",
              soundType: soundType || "general_broadcast",
              senderName: senderName || "الإدارة"
            }
          });
          break;
        }

        case "ADD_IP_MODERATION": {
          const record: IPModerationRecord = payload;
          if (record && record.ip) {
            const existingIdx = serverIPModerations.findIndex(r => r.id === record.id);
            if (existingIdx !== -1) {
              serverIPModerations[existingIdx] = record;
            } else {
              serverIPModerations.push(record);
            }
            saveIPModerationToD1(record);
            broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });

            if (record.type === "ban" && record.targetUserId) {
              const userToBan = serverUsers.find(u => u.id === record.targetUserId);
              if (userToBan) {
                userToBan.isBanned = true;
                userToBan.currentRoomId = '';
                saveUserToD1(userToBan);
              }
              serverRooms = serverRooms.map(r => ({
                ...r,
                kickedUsers: [...(r.kickedUsers || []).filter(uid => uid !== record.targetUserId), record.targetUserId]
              }));
              saveRoomsToD1(serverRooms);
              broadcast({ type: "USER_BANNED", payload: { userId: record.targetUserId, ip: record.ip, reason: record.reason } });
              broadcast({ type: "SYNC_USERS", payload: serverUsers });
              broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
            }
          }
          break;
        }

        case "BAN_USER": {
          const { userId, ip, reason } = payload || {};
          if (userId) {
            const userToBan = serverUsers.find(u => u.id === userId);
            if (userToBan) {
              userToBan.isBanned = true;
              userToBan.currentRoomId = '';
              saveUserToD1(userToBan);
            }
            serverRooms = serverRooms.map(r => ({
              ...r,
              kickedUsers: [...(r.kickedUsers || []).filter(uid => uid !== userId), userId]
            }));
            saveRoomsToD1(serverRooms);
            broadcast({ type: "USER_BANNED", payload: { userId, ip, reason } });
            broadcast({ type: "SYNC_USERS", payload: serverUsers });
            broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
          }
          break;
        }

        case "UNBAN_USER": {
          const { userId, ip } = payload || {};
          if (userId) {
            const userToUnban = serverUsers.find(u => u.id === userId);
            if (userToUnban) {
              userToUnban.isBanned = false;
              saveUserToD1(userToUnban);
            }
            if (ip) {
              serverIPModerations = serverIPModerations.filter(r => r.ip !== ip && r.targetUserId !== userId);
              deleteIPModerationFromD1(ip);
              broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });
            }
            broadcast({ type: "USER_UNBANNED", payload: { userId, ip } });
          }
          break;
        }

        case "REMOVE_IP_MODERATION": {
          const { idOrIp } = payload || {};
          if (idOrIp) {
            serverIPModerations = serverIPModerations.filter(r => r.id !== idOrIp && r.ip !== idOrIp);
            deleteIPModerationFromD1(idOrIp);
            broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });
          }
          break;
        }

        case "DELETE_USER_ACCOUNT": {
          const { userId } = payload || {};
          if (userId) {
            const target = serverUsers.find((u) => u.id === userId);
            if (target && (target.role === 'owner' || target.id === 'user-owner' || target.is_super_admin)) {
              break;
            }
            handleUserDeleted(userId);
          }
          break;
        }

        case "SYSTEM_CACHE_PURGE": {
          broadcast({ type: "SYSTEM_CACHE_PURGED", payload: { timestamp: Date.now() } });
          break;
        }

        case "SEND_NOTIFICATION": {
          const notif: Notification = payload;
          if (notif && !serverNotifications.some((n) => n.id === notif.id)) {
            serverNotifications.unshift(notif);
            saveNotificationToD1(notif);
            broadcast({ type: "NEW_NOTIFICATION", payload: notif });
          }
          break;
        }

        case "MARK_NOTIFICATIONS_READ": {
          const { userId } = payload || {};
          if (userId) {
            markNotificationsReadInD1(userId);
            broadcast({ type: "NOTIFICATIONS_MARKED_READ", payload: { userId } });
          }
          break;
        }

        case "DELETE_NOTIFICATION": {
          const { notifId } = payload || {};
          if (notifId) {
            serverNotifications = serverNotifications.filter((n) => n.id !== notifId);
            deleteNotificationFromD1(notifId);
            broadcast({ type: "NOTIFICATION_DELETED", payload: { notifId } });
          }
          break;
        }

        case "UPDATE_SETTINGS": {
          const newSettings: Partial<SiteSettings> = payload;
          if (newSettings) {
            serverSiteSettings = { ...serverSiteSettings, ...newSettings };
            saveSiteSettingsToD1(serverSiteSettings);
            broadcast({ type: "SYNC_SETTINGS", payload: serverSiteSettings });
          }
          break;
        }

        case "ADD_NEWS_POST": {
          const post: NewsPost = payload;
          if (post && post.id) {
            serverNews = [post, ...serverNews.filter(n => n.id !== post.id)];
            saveNewsPostToD1(post);
            broadcast({ type: "SYNC_NEWS", payload: serverNews });
            broadcast({ type: "NEW_NEWS_POST", payload: post });
          }
          break;
        }

        case "DELETE_NEWS_POST": {
          const { newsId } = payload || {};
          if (newsId) {
            serverNews = serverNews.filter(n => n.id !== newsId);
            deleteNewsPostFromD1(newsId);
            broadcast({ type: "SYNC_NEWS", payload: serverNews });
          }
          break;
        }

        case "REACT_NEWS_POST": {
          const { newsId, reactions } = payload || {};
          if (newsId && reactions) {
            serverNews = serverNews.map(n => n.id === newsId ? { ...n, reactions } : n);
            const found = serverNews.find(n => n.id === newsId);
            if (found) saveNewsPostToD1(found);
            broadcast({ type: "SYNC_NEWS", payload: serverNews });
          }
          break;
        }

        case "ADD_NEWS_COMMENT": {
          const { newsId, comment } = payload || {};
          if (newsId && comment) {
            serverNews = serverNews.map(n => {
              if (n.id === newsId) {
                return { ...n, comments: [...(n.comments || []), comment] };
              }
              return n;
            });
            const found = serverNews.find(n => n.id === newsId);
            if (found) saveNewsPostToD1(found);
            broadcast({ type: "SYNC_NEWS", payload: serverNews });
          }
          break;
        }

        case "ADD_WALL_POST": {
          const post: WallPost = payload;
          if (post && post.id) {
            serverWallPosts = [post, ...serverWallPosts.filter(w => w.id !== post.id)];
            saveWallPostToD1(post);
            broadcast({ type: "SYNC_WALL_POSTS", payload: serverWallPosts });
          }
          break;
        }

        case "DELETE_WALL_POST": {
          const { postId } = payload || {};
          if (postId) {
            serverWallPosts = serverWallPosts.filter(w => w.id !== postId);
            deleteWallPostFromD1(postId);
            broadcast({ type: "SYNC_WALL_POSTS", payload: serverWallPosts });
          }
          break;
        }

        case "REACT_WALL_POST": {
          const { postId, reactions, likes } = payload || {};
          if (postId && reactions) {
            serverWallPosts = serverWallPosts.map(w => w.id === postId ? { ...w, reactions, likes: likes || [] } : w);
            const found = serverWallPosts.find(w => w.id === postId);
            if (found) saveWallPostToD1(found);
            broadcast({ type: "SYNC_WALL_POSTS", payload: serverWallPosts });
          }
          break;
        }

        case "ADD_WALL_COMMENT": {
          const { postId, comment } = payload || {};
          if (postId && comment) {
            serverWallPosts = serverWallPosts.map(w => {
              if (w.id === postId) {
                return { ...w, comments: [...(w.comments || []), comment] };
              }
              return w;
            });
            const found = serverWallPosts.find(w => w.id === postId);
            if (found) saveWallPostToD1(found);
            broadcast({ type: "SYNC_WALL_POSTS", payload: serverWallPosts });
          }
          break;
        }

        case "PING": {
          ws.send(JSON.stringify({ type: "PONG" }));
          break;
        }
      }
    } catch (err) {
      console.error("Error processing WS message:", err);
    }
  });

  ws.on("close", () => {
    if (currentUserId) {
      handleUserLeaving(currentUserId);
    }
  });
});

async function startServer() {
  await initD1Database();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 D1 SQLite persistent chat server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
