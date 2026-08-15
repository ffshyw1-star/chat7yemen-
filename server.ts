import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import initSqlJs, { Database } from "sql.js";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { INITIAL_USERS, INITIAL_MESSAGES, INITIAL_ROOMS } from "./src/data/initialData";
import { Message, PrivateMessage, User, Room } from "./src/types";

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// SQLite D1 Database File Path
const DB_FILE = path.join(process.cwd(), "d1_chat_database.sqlite");
let db: Database;

// Save D1 SQLite database state to disk
function saveD1ToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error("Error writing D1 database to disk:", err);
  }
}

// In-Memory state for live broadcast
let serverUsers: User[] = [];
let serverMessages: Message[] = [];
let serverPrivateMessages: PrivateMessage[] = [];
let serverRooms: Room[] = [];

// Initialize SQLite D1 Engine & Load Seed / Persistent Data
async function initD1Database() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const filebuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(filebuffer);
      console.log("💾 Loaded existing D1 SQLite database from disk.");
    } catch (e) {
      console.warn("Failed to load DB file, initializing fresh SQLite D1:", e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log("✨ Initialized new Cloudflare D1 SQLite database.");
  }

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
  `);

  // Load existing rows or seed initial data
  // 1. Users
  const userRows = db.exec("SELECT data FROM users");
  if (userRows.length > 0 && userRows[0].values.length > 0) {
    serverUsers = userRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverUsers = [...INITIAL_USERS];
    const stmt = db.prepare("INSERT OR REPLACE INTO users (id, username, role, data) VALUES (?, ?, ?, ?)");
    serverUsers.forEach((u) => {
      stmt.run([u.id, u.username, u.role, JSON.stringify(u)]);
    });
    stmt.free();
  }

  // 2. Messages
  const msgRows = db.exec("SELECT data FROM messages");
  if (msgRows.length > 0 && msgRows[0].values.length > 0) {
    serverMessages = msgRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverMessages = [...INITIAL_MESSAGES];
    const stmt = db.prepare("INSERT OR REPLACE INTO messages (id, roomId, senderId, timestamp, data) VALUES (?, ?, ?, ?, ?)");
    serverMessages.forEach((m) => {
      stmt.run([m.id, m.roomId, m.senderId, m.timestamp, JSON.stringify(m)]);
    });
    stmt.free();
  }

  // 3. Private Messages
  const pMsgRows = db.exec("SELECT data FROM private_messages");
  if (pMsgRows.length > 0 && pMsgRows[0].values.length > 0) {
    serverPrivateMessages = pMsgRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverPrivateMessages = [];
  }

  // 4. Rooms
  const roomRows = db.exec("SELECT data FROM rooms");
  if (roomRows.length > 0 && roomRows[0].values.length > 0) {
    serverRooms = roomRows[0].values.map((v) => JSON.parse(v[0] as string));
  } else {
    serverRooms = [...INITIAL_ROOMS];
    const stmt = db.prepare("INSERT OR REPLACE INTO rooms (id, data) VALUES (?, ?)");
    serverRooms.forEach((r) => {
      stmt.run([r.id, JSON.stringify(r)]);
    });
    stmt.free();
  }

  saveD1ToDisk();
}

// Helper SQL Persistence functions
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

function deleteMessageFromD1(messageId: string) {
  try {
    db.run("DELETE FROM messages WHERE id = ?", [messageId]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 deleteMessage error:", e);
  }
}

function clearRoomFromD1(roomId: string) {
  try {
    db.run("DELETE FROM messages WHERE roomId = ?", [roomId]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 clearRoom error:", e);
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

// REST Endpoints for D1 SQLite DB
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
    },
  });
});

app.get("/api/d1/users", (req, res) => {
  res.json({ users: serverUsers });
});

app.get("/api/d1/messages", (req, res) => {
  res.json({ messages: serverMessages });
});

app.get("/api/d1/private-messages", (req, res) => {
  res.json({ privateMessages: serverPrivateMessages });
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
        rooms: serverRooms,
      },
    })
  );

  ws.on("message", (rawMessage: Buffer | string) => {
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
                  onlineStatus: "online" as const,
                  lastSeen: "الآن",
                }
              : {
                  ...user,
                  onlineStatus: "online" as const,
                  lastSeen: "الآن",
                };

            if (existingIdx !== -1) {
              serverUsers[existingIdx] = updatedUser;
            } else {
              serverUsers.push(updatedUser);
            }

            saveUserToD1(updatedUser);
            broadcast({ type: "SYNC_USERS", payload: serverUsers });
            ws.send(JSON.stringify({ type: "USER_UPDATED", payload: updatedUser }));
          }
          break;
        }

        case "SEND_MESSAGE": {
          const msg: Message = payload;
          if (msg && !serverMessages.some((m) => m.id === msg.id)) {
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

        case "DELETE_MESSAGE": {
          const { messageId } = payload || {};
          if (messageId) {
            serverMessages = serverMessages.filter((m) => m.id !== messageId);
            deleteMessageFromD1(messageId);
            broadcast({ type: "MESSAGE_DELETED", payload: { messageId } });
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

        case "DELETE_USER_ACCOUNT": {
          const { userId } = payload || {};
          if (userId) {
            serverUsers = serverUsers.filter((u) => u.id !== userId);
            try {
              db.run("DELETE FROM users WHERE id = ?", [userId]);
              saveD1ToDisk();
            } catch (e) {
              console.error("D1 delete user error:", e);
            }
            broadcast({ type: "USER_DELETED", payload: { userId } });
            broadcast({ type: "SYNC_USERS", payload: serverUsers });
          }
          break;
        }

        case "SYSTEM_CACHE_PURGE": {
          broadcast({ type: "SYSTEM_CACHE_PURGED", payload: { timestamp: Date.now() } });
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
      serverUsers = serverUsers.map((u) => {
        if (u.id === currentUserId) {
          const updated = { ...u, onlineStatus: "away" as const, lastSeen: "منذ قليل" };
          saveUserToD1(updated);
          return updated;
        }
        return u;
      });
      broadcast({ type: "SYNC_USERS", payload: serverUsers });
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
