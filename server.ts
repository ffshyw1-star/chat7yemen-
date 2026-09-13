import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import initSqlJs, { Database } from "sql.js";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { INITIAL_USERS, INITIAL_MESSAGES, INITIAL_ROOMS, INITIAL_NOTIFICATIONS, INITIAL_SITE_SETTINGS, INITIAL_CUSTOM_EMOJIS, INITIAL_NEWS, INITIAL_WALL_POSTS } from "./src/data/initialData";
import { Message, RoomEvent, PrivateMessage, User, Room, IPModerationRecord, FriendRequest, Notification, SiteSettings, CustomEmojiItem, NewsPost, WallPost, GuestBanRecord, ProxyVpnInspectionStats } from "./src/types";
import { initializeApp as initClientFirebase, getApps as getClientApps } from "firebase/app";
import { getFirestore as getClientFirestore, doc as fsDoc, setDoc as fsSetDoc, deleteDoc as fsDeleteDoc, serverTimestamp as fsServerTimestamp } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

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
let serverGuestBans: GuestBanRecord[] = [];

// Unified Date/Time Format in English numerals: DD/MM/YYYY HH:mm
function formatServerDateTime(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatServerDate(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatServerTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Sovereign Primary Owner Identifiers & Immutable Protection Helpers
const PRIMARY_OWNER_ID = "user-owner";
const PRIMARY_OWNER_EMAIL = "alzymasd9@gmail.com";

function isPrimaryOwner(userOrId?: any): boolean {
  if (!userOrId) return false;
  if (typeof userOrId === 'string') {
    if (userOrId === PRIMARY_OWNER_ID || userOrId === 'primary-owner') return true;
    const found = serverUsers.find(u => u.id === userOrId);
    if (found) return isPrimaryOwner(found);
    return false;
  }
  return Boolean(
    userOrId.id === PRIMARY_OWNER_ID ||
    userOrId.isPrimaryOwner === true ||
    userOrId.is_primary_owner === true ||
    userOrId.email === PRIMARY_OWNER_EMAIL ||
    (userOrId.role === 'owner' && (userOrId.username === 'Owner' || userOrId.username === 'صاحب الموقع'))
  );
}

// Proxy/VPN/Tor/Datacenter Inspection Live Stats

const proxyVpnInspectionStats: ProxyVpnInspectionStats = {
  isRunning: true,
  proxyDetectedCount: 0,
  vpnDetectedCount: 0,
  torDetectedCount: 0,
  datacenterCount: 0,
  normalCount: 0,
  unknownCount: 0,
  recentChecks: []
};

// Map of standard ISO country codes to Arabic names and flags
const ISO_COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  YE: { name: "اليمن", flag: "🇾🇪" },
  SA: { name: "السعودية", flag: "🇸🇦" },
  AE: { name: "الإمارات", flag: "🇦🇪" },
  OM: { name: "عمان", flag: "🇴🇲" },
  QA: { name: "قطر", flag: "🇶🇦" },
  KW: { name: "الكويت", flag: "🇰🇼" },
  BH: { name: "البحرين", flag: "🇧🇭" },
  EG: { name: "مصر", flag: "🇪🇬" },
  IQ: { name: "العراق", flag: "🇮🇶" },
  SY: { name: "سوريا", flag: "🇸🇾" },
  JO: { name: "الأردن", flag: "🇯🇴" },
  PS: { name: "فلسطين", flag: "🇵🇸" },
  LB: { name: "لبنان", flag: "🇱🇧" },
  SD: { name: "السودان", flag: "🇸🇩" },
  DZ: { name: "الجزائر", flag: "🇩🇿" },
  MA: { name: "المغرب", flag: "🇲🇦" },
  TN: { name: "تونس", flag: "🇹🇳" },
  LY: { name: "ليبيا", flag: "🇱🇾" },
  SO: { name: "الصومال", flag: "🇸🇴" },
  MR: { name: "موريتانيا", flag: "🇲🇷" },
  DJ: { name: "جيبوتي", flag: "🇩🇯" },
  TR: { name: "تركيا", flag: "🇹🇷" },
  US: { name: "الولايات المتحدة", flag: "🇺🇸" },
  GB: { name: "بريطانيا", flag: "🇬🇧" },
  DE: { name: "ألمانيا", flag: "🇩🇪" }
};

// Helper to inspect connection for Proxy / VPN / Tor / Datacenter markers
function inspectConnection(req: express.Request, clientIp: string): {
  isProxy: boolean;
  isVpn: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  indicator: 'Proxy detected' | 'VPN detected' | 'Tor detected' | 'Datacenter IP' | 'Normal connection' | 'Unknown';
} {
  const headers = req.headers;
  
  // 1. Proxy headers
  const via = headers['via'] || headers['x-via'] || '';
  const forwarded = headers['forwarded'] || '';
  const xForwardedFor = headers['x-forwarded-for'];
  const hasMultipleHops = typeof xForwardedFor === 'string' && xForwardedFor.split(',').length > 1;
  const proxyConnection = headers['proxy-connection'] || headers['x-proxy-id'] || '';
  const isProxyHeader = Boolean(via || proxyConnection || hasMultipleHops || headers['x-bluecoat-via'] || headers['x-cache']);

  // 2. Tor exit node check
  const isTor = Boolean(
    headers['x-tor-exit-node'] ||
    headers['tor-exit-node'] ||
    clientIp.startsWith('104.244.7') ||
    clientIp.startsWith('185.220.') ||
    clientIp.startsWith('192.42.116.')
  );

  // 3. Datacenter IP ranges
  const isDatacenter = Boolean(
    clientIp.startsWith('34.') ||
    clientIp.startsWith('35.') ||
    clientIp.startsWith('52.') ||
    clientIp.startsWith('54.') ||
    clientIp.startsWith('13.') ||
    clientIp.startsWith('20.') ||
    clientIp.startsWith('104.40.') ||
    clientIp.startsWith('138.68.') ||
    clientIp.startsWith('159.65.') ||
    clientIp.startsWith('167.99.') ||
    clientIp.startsWith('142.93.') ||
    clientIp.startsWith('178.62.') ||
    clientIp.startsWith('188.166.') ||
    clientIp.startsWith('139.59.') ||
    clientIp.startsWith('159.203.') ||
    clientIp.startsWith('46.101.') ||
    clientIp.startsWith('165.22.') ||
    clientIp.startsWith('95.216.') ||
    clientIp.startsWith('95.217.') ||
    clientIp.startsWith('65.108.') ||
    clientIp.startsWith('65.109.') ||
    clientIp.startsWith('135.181.') ||
    clientIp.startsWith('144.76.') ||
    clientIp.startsWith('148.251.') ||
    clientIp.startsWith('195.201.') ||
    clientIp.startsWith('5.9.')
  );

  // 4. VPN markers
  const isVpn = Boolean(
    headers['x-vpn-connection'] ||
    headers['x-wireguard'] ||
    headers['x-openvpn'] ||
    (isProxyHeader && !isDatacenter)
  );

  const isProxy = isProxyHeader;

  let indicator: 'Proxy detected' | 'VPN detected' | 'Tor detected' | 'Datacenter IP' | 'Normal connection' | 'Unknown' = 'Normal connection';

  if (isTor) {
    indicator = 'Tor detected';
  } else if (isVpn) {
    indicator = 'VPN detected';
  } else if (isProxy) {
    indicator = 'Proxy detected';
  } else if (isDatacenter) {
    indicator = 'Datacenter IP';
  } else if (clientIp === '127.0.0.1' || clientIp === 'localhost') {
    indicator = 'Normal connection';
  } else if (!clientIp || clientIp === 'unknown') {
    indicator = 'Unknown';
  }

  return { isProxy, isVpn, isTor, isDatacenter, indicator };
}

function recordInspectionCheck(
  ip: string,
  indicator: 'Proxy detected' | 'VPN detected' | 'Tor detected' | 'Datacenter IP' | 'Normal connection' | 'Unknown',
  actionTaken: 'allowed' | 'blocked',
  username?: string,
  reason?: string
) {
  if (indicator === 'Proxy detected') proxyVpnInspectionStats.proxyDetectedCount++;
  else if (indicator === 'VPN detected') proxyVpnInspectionStats.vpnDetectedCount++;
  else if (indicator === 'Tor detected') proxyVpnInspectionStats.torDetectedCount++;
  else if (indicator === 'Datacenter IP') proxyVpnInspectionStats.datacenterCount++;
  else if (indicator === 'Normal connection') proxyVpnInspectionStats.normalCount++;
  else proxyVpnInspectionStats.unknownCount++;

  proxyVpnInspectionStats.recentChecks.unshift({
    id: `check-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    ip,
    indicator,
    actionTaken,
    username,
    reason
  });

  if (proxyVpnInspectionStats.recentChecks.length > 50) {
    proxyVpnInspectionStats.recentChecks.pop();
  }
}

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
      CREATE TABLE IF NOT EXISTS guest_bans (
        id TEXT PRIMARY KEY,
        status TEXT,
        reason TEXT,
        createdAt INTEGER,
        expiresAt INTEGER,
        targetRoom TEXT,
        identifiers TEXT,
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
          isPrimaryOwner: true,
          password: 'Owner@2026',
          email: 'owner@chat.ye',
          role: 'owner',
          membership: {
            rank: 'owner',
            startAt: 1787731200000,
            expiresAt: null,
            durationDays: 0,
            permanent: true,
            status: 'active',
            assignedBy: 'system'
          },
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
        // Purge any mock/dummy users, delete fake owner/visitor accounts, and ensure clean state
        const mockUserIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-site-owner'];
        serverUsers = loadedUsers
          .filter(u => !mockUserIds.includes(u.id) && u.username !== 'المالك' && u.username !== 'صاحب الموقع' && !u.id.startsWith('visitor-'))
          .map(u => {
            const cleanJoinedDate = (!u.joinedDate || u.joinedDate === '01/01/2026') ? '26/08/2026' : u.joinedDate;
            if (u.id === 'user-system') {
              return {
                ...u,
                username: 'System',
                role: 'system' as const,
                isSystem: true,
                avatar: '/bot_badge.svg',
                statusMessage: '🤖 النظام الإداري المباشر | System',
                bio: 'حساب النظام الآلي الرسمي للشات لنشر التنبيهات والإشعارات والترحيب.',
                country: 'اليمن',
                countryFlag: '⚙️',
                specialty: 'إدارة وتقنية 💻',
                language: 'العربية 🇸🇦',
                onlineStatus: 'online' as const,
                isOnline: true,
                lastSeen: formatServerDateTime(new Date()),
                lastSeenTimestamp: Date.now()
              };
            }
            if (isPrimaryOwner(u) || u.id === 'user-owner' || u.username === 'Owner') {
              return {
                ...u,
                id: PRIMARY_OWNER_ID,
                username: u.username || 'Owner',
                isPrimaryOwner: true,
                role: 'owner' as const,
                membership: {
                  rank: 'owner',
                  startAt: u.membership?.startAt || 1787731200000,
                  expiresAt: null,
                  durationDays: 0,
                  permanent: true,
                  status: 'active',
                  assignedBy: 'system'
                },
                statusMessage: u.statusMessage || '👑 Owner | مرحباً بكم في دردشة عربي المطورة',
                joinedDate: cleanJoinedDate,
                friends: (u.friends || []).filter(fId => fId !== 'user-system' && fId !== 'system'),
                onlineStatus: 'offline' as const,
                isOnline: false,
                lastSeen: u.lastSeenTimestamp ? formatServerDateTime(new Date(u.lastSeenTimestamp)) : (u.lastSeen || formatServerDateTime(new Date())),
                lastSeenTimestamp: u.lastSeenTimestamp || Date.now()
              };
            }
            if (u.role === 'owner') {
              // Granted Owner: role is owner, but NOT primary owner
              return {
                ...u,
                isPrimaryOwner: false,
                role: 'owner' as const,
                joinedDate: cleanJoinedDate,
                friends: (u.friends || []).filter(fId => fId !== 'user-system' && fId !== 'system'),
                onlineStatus: 'offline' as const,
                isOnline: false,
                lastSeen: u.lastSeenTimestamp ? formatServerDateTime(new Date(u.lastSeenTimestamp)) : (u.lastSeen || formatServerDateTime(new Date())),
                lastSeenTimestamp: u.lastSeenTimestamp || Date.now()
              };
            }

            return {
              ...u,
              joinedDate: cleanJoinedDate,
              friends: (u.friends || []).filter(fId => fId !== 'user-system' && fId !== 'system'),
              onlineStatus: 'offline' as const,
              isOnline: false,
              lastSeen: u.lastSeenTimestamp ? formatServerDateTime(new Date(u.lastSeenTimestamp)) : (u.lastSeen || formatServerDateTime(new Date())),
              lastSeenTimestamp: u.lastSeenTimestamp || Date.now()
            };
          });

        // Ensure user-system exists
        if (!serverUsers.some(u => u.id === 'user-system')) {
          serverUsers.unshift({
            id: 'user-system',
            username: 'System',
            role: 'system' as const,
            gender: 'other',
            age: 99,
            avatar: '/bot_badge.svg',
            statusMessage: '🤖 النظام الإداري المباشر | System',
            bio: 'حساب النظام الآلي الرسمي للشات لنشر التنبيهات والإشعارات والترحيب.',
            coins: 0,
            likes: 100,
            likedBy: [],
            country: 'اليمن',
            countryFlag: '⚙️',
            specialty: 'إدارة وتقنية 💻',
            language: 'العربية 🇸🇦',
            currentRoomId: 'room-general',
            joinedDate: '26/08/2026',
            joinedTimestamp: 1787731200000,
            lastSeen: 'الآن',
            lastSeenTimestamp: Date.now(),
            usernameColor: '#00a2e8',
            fontColor: '#00a2e8',
            fontSize: 16,
            isStealth: false,
            privatePrivacy: 'everyone',
            onlineStatus: 'online' as const,
            isOnline: true,
            ip: '127.0.0.1',
            friends: [],
            ignores: []
          });
        }

        try {
          db.run("DELETE FROM users WHERE username = 'صاحب الموقع' OR id = 'user-site-owner' OR id LIKE 'visitor-%'");
          mockUserIds.forEach(id => {
            try { db.run("DELETE FROM users WHERE id = ?", [id]); } catch (e) {}
          });
        } catch (e) {}

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

  // 2. Messages - Purge any mock messages, old evt messages, and legacy join/leave messages
  const mockMsgIds = ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6'];
  const mockSenderIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'];
  try {
    db.run(`DELETE FROM messages WHERE id IN ('msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6') OR id LIKE 'msg-hist-%' OR id LIKE 'evt-%' OR id LIKE 'sys-exit-%' OR senderId IN ('user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8') OR text LIKE '%غادر%الغرفة%' OR text LIKE '%انضم%للغرفة%'`);
  } catch (e) {}

  const msgRows = db.exec("SELECT data FROM messages");
  if (msgRows.length > 0 && msgRows[0].values.length > 0) {
    serverMessages = msgRows[0].values
      .map((v) => JSON.parse(v[0] as string))
      .filter((m: Message) => !mockMsgIds.includes(m.id) && !m.id.startsWith('msg-hist-') && !m.id.startsWith('evt-') && !m.id.startsWith('sys-exit-') && !mockSenderIds.includes(m.senderId) && m.type !== 'room_event' && !m.text?.includes('غادر'));
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

  // 6.b Guest Bans
  try {
    const banRows = db.exec("SELECT data FROM guest_bans");
    if (banRows.length > 0 && banRows[0].values.length > 0) {
      serverGuestBans = banRows[0].values.map((v) => JSON.parse(v[0] as string));
    } else {
      serverGuestBans = [];
    }
  } catch (e) {
    serverGuestBans = [];
  }

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
    if (roomId === "all") {
      db.run("DELETE FROM messages");
    } else {
      db.run("DELETE FROM messages WHERE roomId = ?", [roomId]);
    }
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

function saveGuestBanToD1(record: GuestBanRecord) {
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO guest_bans (id, status, reason, createdAt, expiresAt, targetRoom, identifiers, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run([
      record.id,
      record.status,
      record.reason,
      record.createdAt,
      record.expiresAt,
      record.targetRoom || 'all',
      JSON.stringify(record.identifiers || {}),
      JSON.stringify(record)
    ]);
    stmt.free();
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 saveGuestBan error:", e);
  }
}

function deleteGuestBanFromD1(id: string) {
  try {
    db.run("DELETE FROM guest_bans WHERE id = ?", [id]);
    saveD1ToDisk();
  } catch (e) {
    console.error("D1 deleteGuestBan error:", e);
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
    if (roomId === "all") {
      serverMessages = [];
    } else {
      serverMessages = serverMessages.filter((m) => m.roomId !== roomId);
    }
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

app.post("/api/private/clear-all", (req, res) => {
  serverPrivateMessages = [];
  try {
    if (db) {
      db.run("DELETE FROM private_messages");
      saveD1ToDisk();
    }
  } catch (e) {
    console.error("Error clearing all PMs from D1:", e);
  }
  broadcast({ type: "SYNC_PRIVATE_MESSAGES", payload: [] });
  return res.json({ success: true });
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
  const { action, record, idOrIp, requesterId, requesterRole } = req.body || {};

  // RBAC Server-side Verification: Only staff (owner, admin, management) can moderate IPs
  const requester = serverUsers.find(u => u.id === requesterId);
  const effectiveRole = getEffectiveUserRole(requester) || requesterRole;
  if (!['owner', 'admin', 'management'].includes(effectiveRole || '')) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized: IP moderation requires owner, admin, or management role"
    });
  }

  // Prevent banning Owner IP or Owner account
  if (record && (record.ip === '197.220.12.89' || record.targetUserId === 'user-owner' || record.targetUsername?.toLowerCase() === 'owner')) {
    return res.status(403).json({
      success: false,
      error: "Cannot ban Owner account or Owner IP"
    });
  }

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
  if ((serverSiteSettings as any).bannedIps) {
    (serverSiteSettings as any).bannedIps = (serverSiteSettings as any).bannedIps.filter((ip: string) => ip !== targetIp && ip !== '197.220.12.89');
  }
  saveSiteSettingsToD1(serverSiteSettings);

  // Unban user in memory & DB if marked
  serverUsers.forEach(u => {
    if (u.username.toLowerCase() === 'owner' || u.ip === targetIp || u.ip === '197.220.12.89' || (deviceId && (u as any).deviceId === deviceId)) {
      u.isBanned = false;
      saveUserToD1(u);
    }
  });

  broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });
  broadcast({ type: "SYNC_SITE_SETTINGS", payload: serverSiteSettings });
  broadcast({ type: "SYNC_USERS", payload: serverUsers });

  res.json({ success: true, message: "Device and IP unbanned successfully" });
});

// Proxy/VPN Inspection status endpoint
app.get("/api/security/proxy-vpn-status", (req, res) => {
  res.json({
    success: true,
    stats: proxyVpnInspectionStats,
    settings: {
      enableProxyVpnDetection: serverSiteSettings.enableProxyVpnDetection !== false,
      blockProxyVpn: !!serverSiteSettings.blockProxyVpn,
      blockTor: !!serverSiteSettings.blockTor,
      blockDatacenterIp: !!serverSiteSettings.blockDatacenterIp
    }
  });
});

// Proxy/VPN security settings update
app.post("/api/security/proxy-vpn-settings", (req, res) => {
  const { enableProxyVpnDetection, blockProxyVpn, blockTor, blockDatacenterIp } = req.body || {};
  serverSiteSettings = {
    ...serverSiteSettings,
    enableProxyVpnDetection: enableProxyVpnDetection !== undefined ? enableProxyVpnDetection : serverSiteSettings.enableProxyVpnDetection,
    blockProxyVpn: blockProxyVpn !== undefined ? blockProxyVpn : serverSiteSettings.blockProxyVpn,
    blockTor: blockTor !== undefined ? blockTor : serverSiteSettings.blockTor,
    blockDatacenterIp: blockDatacenterIp !== undefined ? blockDatacenterIp : serverSiteSettings.blockDatacenterIp,
  };
  saveSiteSettingsToD1(serverSiteSettings);
  broadcast({ type: "SYNC_SITE_SETTINGS", payload: serverSiteSettings });
  res.json({ success: true, settings: serverSiteSettings });
});

// Geo Country lookup endpoint
app.get("/api/geo/lookup", (req, res) => {
  const clientIp = (req.query.ip as string) || getClientIp(req);
  const cfCountry = req.headers['cf-ipcountry'] as string;
  const xCountry = req.headers['x-country-code'] as string;
  const countryCode = (cfCountry || xCountry || 'YE').toUpperCase();
  const resolved = ISO_COUNTRY_MAP[countryCode] || { name: 'اليمن', flag: '🇾🇪' };

  res.json({
    success: true,
    ip: clientIp,
    countryCode,
    country: resolved.name,
    flag: resolved.flag
  });
});

// Server-authoritative Guest Validation endpoint
app.post("/api/auth/guest-validate", (req, res) => {
  const { username, gender, age, deviceId, browserFingerprint } = req.body || {};
  const clientIp = getClientIp(req);
  const now = Date.now();

  const cleanUsername = (username || '').trim();
  if (!cleanUsername) {
    return res.status(400).json({ allowed: false, reason: "يرجى كتابة اسم مستعار صالح للدخول كزائر" });
  }
  if (cleanUsername.length > 30) {
    return res.status(400).json({ allowed: false, reason: "الاسم المستعار طويل جداً (الحد الأقصى 30 حرفاً)" });
  }

  // 1. Check if name is taken by a registered member or system
  const reservedUser = serverUsers.find(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.role !== 'visitor'
  );
  if (reservedUser) {
    return res.status(409).json({
      allowed: false,
      reason: `الاسم "${cleanUsername}" مسجل لعضو أو رتبة إدارية. يرجى تسجيل الدخول بحسابك أو اختيار اسم آخر للزوار.`
    });
  }

  // Check if visitor with same name is currently active online
  const duplicateOnlineVisitor = serverUsers.find(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase() &&
         u.role === 'visitor' &&
         u.onlineStatus === 'online' &&
         presenceManager.isUserOnline(u.id)
  );
  if (duplicateOnlineVisitor) {
    return res.status(409).json({
      allowed: false,
      reason: `يوجد زائر متصل حالياً بنفس هذا الاسم "${cleanUsername}". يرجى اختيار اسم مستعار مختلف.`
    });
  }

  // 2. Moderation Check (Kick / Mute / GuestBans)
  const activeIpMods = serverIPModerations.filter(rec => {
    if (rec.ip !== clientIp && rec.ip !== 'all' && (!deviceId || rec.deviceId !== deviceId)) return false;
    if (rec.type === 'ban') return true;
    if (rec.expiresAt) return new Date(rec.expiresAt).getTime() > now;
    return true;
  });

  const activeKick = activeIpMods.find(r => r.type === 'kick');
  if (activeKick) {
    recordInspectionCheck(clientIp, 'Normal connection', 'blocked', cleanUsername, activeKick.reason || 'طرد مؤقت');
    return res.status(403).json({
      allowed: false,
      reason: activeKick.reason ? `تم طردك مؤقتاً: ${activeKick.reason}` : 'تم طردك مؤقتاً لمخالفة التعليمات. يرجى الانتظار حتى انتهاء مدة الطرد.'
    });
  }

  // Check guest ban records in serverGuestBans
  const activeGuestBan = serverGuestBans.find(b => {
    if (b.status !== 'active') return false;
    if (b.expiresAt && b.expiresAt < now) return false;
    const idf = b.identifiers || {};
    if (idf.ip && idf.ip === clientIp) return true;
    if (deviceId && idf.deviceId && idf.deviceId === deviceId) return true;
    if (browserFingerprint && idf.browserFingerprint && idf.browserFingerprint === browserFingerprint) return true;
    return false;
  });

  if (activeGuestBan) {
    recordInspectionCheck(clientIp, 'Normal connection', 'blocked', cleanUsername, activeGuestBan.reason);
    return res.status(403).json({
      allowed: false,
      reason: activeGuestBan.reason || 'تم حظر جهازك أو عنوان شبكتك كزائر لمخالفة القوانين.'
    });
  }

  // 3. Ban Check (IP ban, Device ban, Browser ban, Country ban)
  const isIpBanned = activeIpMods.some(r => r.type === 'ban');
  if (isIpBanned) {
    recordInspectionCheck(clientIp, 'Normal connection', 'blocked', cleanUsername, 'IP Ban');
    return res.status(403).json({
      allowed: false,
      reason: 'لقد تم حظر عنوان IP الخاص بك من الدردشة لمخالفة الشروط والأحكام.'
    });
  }

  // Check blocked devices in siteSettings
  if (deviceId && Array.isArray(serverSiteSettings.blockedDevices)) {
    const isDeviceBanned = serverSiteSettings.blockedDevices.some(d =>
      typeof d === 'string' ? d === deviceId : (d.id === deviceId || d.token === deviceId)
    );
    if (isDeviceBanned) {
      recordInspectionCheck(clientIp, 'Normal connection', 'blocked', cleanUsername, 'Device Ban');
      return res.status(403).json({
        allowed: false,
        reason: 'تم حظر هذا الجهاز من الدخول إلى الدردشة بناءً على تعليمات الإدارة.'
      });
    }
  }

  // Check blocked browsers
  if (browserFingerprint && Array.isArray(serverSiteSettings.blockedBrowsers)) {
    const isBrowserBanned = serverSiteSettings.blockedBrowsers.some(b =>
      typeof b === 'string' ? b === browserFingerprint : (b.id === browserFingerprint || b.fingerprint === browserFingerprint)
    );
    if (isBrowserBanned) {
      recordInspectionCheck(clientIp, 'Normal connection', 'blocked', cleanUsername, 'Browser Ban');
      return res.status(403).json({
        allowed: false,
        reason: 'تم حظر المتصفح المستخدم من الدخول إلى الدردشة.'
      });
    }
  }

  // 4. Proxy / VPN / Tor / Datacenter Inspection
  const inspection = inspectConnection(req, clientIp);
  const enableDetection = serverSiteSettings.enableProxyVpnDetection !== false;

  if (enableDetection) {
    if (inspection.isTor && serverSiteSettings.blockTor) {
      recordInspectionCheck(clientIp, 'Tor detected', 'blocked', cleanUsername, 'حظر شبكة Tor');
      return res.status(403).json({
        allowed: false,
        reason: '🚫 تم حظر الاتصال عبر شبكة Tor وفق إعدادات الأمان الخاصة بالدردشة.'
      });
    }

    if (inspection.isVpn && serverSiteSettings.blockProxyVpn) {
      recordInspectionCheck(clientIp, 'VPN detected', 'blocked', cleanUsername, 'حظر شبكات الـ VPN');
      return res.status(403).json({
        allowed: false,
        reason: '🚫 تم حظر الاتصال عبر شبكات الـ VPN وفق إعدادات الأمان الخاصة بالدردشة.'
      });
    }

    if (inspection.isProxy && serverSiteSettings.blockProxyVpn) {
      recordInspectionCheck(clientIp, 'Proxy detected', 'blocked', cleanUsername, 'حظر البروكسي (Proxy)');
      return res.status(403).json({
        allowed: false,
        reason: '🚫 تم حظر الاتصال عبر البروكسي (Proxy) وفق إعدادات الأمان الخاصة بالدردشة.'
      });
    }

    if (inspection.isDatacenter && serverSiteSettings.blockDatacenterIp) {
      recordInspectionCheck(clientIp, 'Datacenter IP', 'blocked', cleanUsername, 'حظر مراكز البيانات (Datacenter IP)');
      return res.status(403).json({
        allowed: false,
        reason: '🚫 تم حظر الاتصال من مراكز البيانات والخدمات السحابية وفق إعدادات الأمان.'
      });
    }
  }

  // Record connection inspection check
  recordInspectionCheck(clientIp, inspection.indicator, 'allowed', cleanUsername);

  // 5. Country Determination
  const cfCountry = req.headers['cf-ipcountry'] as string;
  const xCountry = req.headers['x-country-code'] as string;
  const countryCode = (cfCountry || xCountry || 'YE').toUpperCase();
  const resolvedCountry = ISO_COUNTRY_MAP[countryCode] || { name: 'اليمن', flag: '🇾🇪' };

  // Check if country is blocked in siteSettings
  if (Array.isArray(serverSiteSettings.blockedCountries)) {
    const isCountryBanned = serverSiteSettings.blockedCountries.some(c =>
      typeof c === 'string' ? (c === countryCode || c === resolvedCountry.name) : (c.code === countryCode || c.name === resolvedCountry.name)
    );
    if (isCountryBanned) {
      return res.status(403).json({
        allowed: false,
        reason: `الدخول محجوب من دولتك (${resolvedCountry.name}) وفق إعدادات الموقع.`
      });
    }
  }

  // 6. Construct Visitor User and Persist to SQLite D1
  const visitorId = `visitor-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const nowObj = new Date();
  const visitor: User = {
    id: visitorId,
    username: cleanUsername,
    role: 'visitor',
    gender: gender === 'female' ? 'female' : 'male',
    age: Number(age) || 20,
    avatar: gender === 'female' ? '/default_female.svg' : '/default_male.svg',
    country: resolvedCountry.name,
    countryFlag: resolvedCountry.flag,
    joinedDate: formatServerDate(nowObj),
    joinedTimestamp: nowObj.getTime(),
    lastSeen: formatServerDateTime(nowObj),
    lastSeenTimestamp: nowObj.getTime(),
    coins: 0,
    likes: 0,
    privatePrivacy: 'everyone',
    onlineStatus: 'online',
    isOnline: true,
    ip: clientIp,
    deviceId: deviceId || undefined,
    browserFingerprint: browserFingerprint || undefined,
    currentRoomId: 'room-general'
  };

  serverUsers.push(visitor);
  saveUserToD1(visitor);
  broadcast({ type: "SYNC_USERS", payload: serverUsers });

  const guestSessionId = `gsess-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  res.json({
    allowed: true,
    user: visitor,
    guestSessionId,
    country: resolvedCountry.name,
    countryFlag: resolvedCountry.flag
  });
});

// Server-authoritative Guest Moderation Action (Kick / Ban / Mute)
app.post("/api/moderation/guest-action", (req, res) => {
  const { action, targetUserId, reason, durationMinutes, actionBy, targetRoom } = req.body || {};
  const targetUser = serverUsers.find(u => u.id === targetUserId);

  const durationMs = (durationMinutes || 60) * 60 * 1000;
  const expiresAt = Date.now() + durationMs;

  const gban: GuestBanRecord = {
    id: `gban-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'active',
    reason: reason || 'مخالفة تعليمات الدردشة',
    createdAt: Date.now(),
    expiresAt,
    targetRoom: targetRoom || 'all',
    actionBy: actionBy || 'الإدارة',
    identifiers: {
      ip: targetUser?.ip || 'unknown',
      deviceId: targetUser?.deviceId,
      browserFingerprint: targetUser?.browserFingerprint,
      username: targetUser?.username
    }
  };

  serverGuestBans.push(gban);
  saveGuestBanToD1(gban);

  if (action === 'kick' || action === 'ban') {
    if (targetUser) {
      handleUserLeaving(targetUserId, true);
    }
  }

  broadcast({ type: "GUEST_MODERATION_ACTION", payload: gban });
  res.json({ success: true, guestBan: gban });
});

function parseMessageTimestamp(m: Message): number {
  if (typeof m.createdAt === "number" && !isNaN(m.createdAt) && m.createdAt > 0) {
    return m.createdAt;
  }
  if (typeof m.createdAt === "string") {
    const num = Number(m.createdAt);
    if (!isNaN(num) && num > 1000000) return num;
    const dt = new Date(m.createdAt).getTime();
    if (!isNaN(dt)) return dt;
  }
  if (m.timestamp) {
    const dt = new Date(m.timestamp).getTime();
    if (!isNaN(dt)) return dt;
  }
  if (m.date && m.timestamp) {
    const dt = new Date(`${m.date} ${m.timestamp}`).getTime();
    if (!isNaN(dt)) return dt;
  }
  if (m.id) {
    const match = m.id.match(/\d{10,}/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (!isNaN(parsed) && parsed > 1000000) return parsed;
    }
  }
  return 0;
}

// History pagination endpoint: allows authorized ranks to load older messages
app.get("/api/messages/history", (req, res) => {
  const roomId = (req.query.roomId as string) || "room-general";
  const beforeTimestamp = req.query.beforeTimestamp as string;
  const limit = Math.min(100, Math.max(10, parseInt((req.query.limit as string) || "25", 10)));
  const role = (req.query.role as string) || "";

  // Visitors cannot load older messages
  if (!role || role === "visitor") {
    return res.status(403).json({
      success: false,
      error: "عذراً، أرشيف الرسائل القديمة متاح للأعضاء المسجلين فقط."
    });
  }

  // Maximum allowed older messages per role:
  // - member: up to 200 older messages
  // - vip: up to 500 older messages
  // - moderator / management / admin / owner / system: up to 5000 older messages
  const maxOlderLimit = role === "member" ? 200 : (role === "vip" ? 500 : 5000);

  let msgs = serverMessages.filter((m) => m.roomId === roomId && m.type !== 'room_event' && !m.id.startsWith('evt-') && !m.id.startsWith('sys-exit-') && !m.text?.includes('غادر'));
  if (beforeTimestamp) {
    let beforeTime = Number(beforeTimestamp);
    if (isNaN(beforeTime) || beforeTime <= 1000000) {
      beforeTime = new Date(beforeTimestamp).getTime();
    }
    if (!isNaN(beforeTime)) {
      msgs = msgs.filter((m) => parseMessageTimestamp(m) < beforeTime);
    }
  }

  // Sort descending by time to pick the closest older messages
  msgs.sort((a, b) => parseMessageTimestamp(b) - parseMessageTimestamp(a));
  
  // Enforce role cap
  const cappedMsgs = msgs.slice(0, maxOlderLimit);
  const batch = cappedMsgs.slice(0, limit);
  // Restore ascending chronological order
  batch.sort((a, b) => parseMessageTimestamp(a) - parseMessageTimestamp(b));

  res.json({
    success: true,
    messages: batch,
    hasMore: cappedMsgs.length > limit,
    totalOlder: cappedMsgs.length,
    maxLimit: maxOlderLimit
  });
});

// REST Endpoint to update user profile, avatar, username, coins, roles
app.post("/api/users/update", (req, res) => {
  const { user, requesterId } = req.body || {};
  if (user && user.id) {
    // Absolute Primary Owner Protection
    if (isPrimaryOwner(user.id)) {
      if (requesterId && requesterId !== PRIMARY_OWNER_ID && requesterId !== user.id) {
        return res.status(403).json({
          success: false,
          error: "🚫 غير مصرح: لا يمكن تعديل بيانات صاحب الموقع الأساسي إلا بواسطة المالك الأساسي نفسه."
        });
      }
      // Immutable Primary Owner Sovereignty: Role cannot be downgraded, permanent membership is preserved
      user.id = PRIMARY_OWNER_ID;
      user.role = 'owner';
      user.isPrimaryOwner = true;
      if (!user.membership) {
        user.membership = {
          rank: 'owner',
          status: 'active',
          permanent: true,
          expiresAt: null,
          durationDays: 0,
          assignedBy: 'system'
        };
      } else {
        user.membership.rank = 'owner';
        user.membership.permanent = true;
        user.membership.expiresAt = null;
        user.membership.status = 'active';
      }
    }

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

  // Absolute Primary Owner Protection: NEVER allow deleting or disabling Primary Owner account
  if (isPrimaryOwner(userId) || isPrimaryOwner(target) || userId === PRIMARY_OWNER_ID) {
    return res.status(403).json({
      success: false,
      error: "🚫 حساب صاحب الموقع الأساسي محمي بشكل مطلق ودائم، ولا يمكن حذفه أو تعطيله نهائياً."
    });
  }

  if (target && (target.role === 'owner' || target.is_super_admin)) {
    // Only Primary Owner can delete a Granted Owner
    const requester = serverUsers.find(u => u.id === requesterId);
    if (!isPrimaryOwner(requester)) {
      return res.status(403).json({
        success: false,
        error: "🚫 لا يمكن حذف أو تعطيل حساب مالك إلا بواسطة صاحب الموقع الأساسي."
      });
    }
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

// REST Endpoint: Securely change member password by Owner with salted SHA-256
app.post("/api/admin/change-member-password", async (req, res) => {
  try {
    const { requesterId, targetUserId, newPassword } = req.body || {};

    if (!requesterId) {
      return res.status(401).json({ success: false, error: "يجب تسجيل الدخول كمالك أو إدارة لتنفيذ هذا الأمر" });
    }

    const requester = serverUsers.find((u) => u.id === requesterId);
    const isOwner = requester && (requester.role === 'owner' || requester.id === 'user-owner' || requester.email === 'alzymasd9@gmail.com');
    if (!isOwner) {
      return res.status(403).json({ success: false, error: "🚫 غير مصرح: المالك الرئيسي فقط من يملك صلاحية تغيير كلمات المرور للأعضاء" });
    }

    if (!targetUserId || !newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 5) {
      return res.status(400).json({ success: false, error: "يجب أن تتكون كلمة المرور من 5 خانات على الأقل وغير فارغة" });
    }

    const targetUserIdx = serverUsers.findIndex((u) => u.id === targetUserId);
    if (targetUserIdx === -1) {
      return res.status(404).json({ success: false, error: "العضو المطلوب غير موجود في السيرفر" });
    }

    const targetUser = serverUsers[targetUserIdx];

    // Primary owner account protection
    if (targetUser.id === 'user-owner' && requesterId !== 'user-owner') {
      return res.status(403).json({ success: false, error: "🚫 لا يمكن تغيير كلمة مرور المالك الرئيسي إلا بواسطة المالك الرئيسي نفسه" });
    }

    // Securely hash password with salted SHA-256 (Never store plain text in Firestore!)
    const salt = "arabsyemen_salt_2026_";
    const hash = crypto.createHash("sha256").update(salt + newPassword.trim()).digest("hex");
    const hashedPassword = `sha256:${hash}`;

    // Update in memory and SQLite D1
    targetUser.password = hashedPassword;
    targetUser.passwordUpdatedAt = Date.now();
    saveUserToD1(targetUser);

    // Sync to Firestore without plain text password
    try {
      const dbClient = getClientFirestore();
      const uDocRef = fsDoc(dbClient, "users", targetUserId);
      await fsSetDoc(uDocRef, {
        passwordUpdatedAt: fsServerTimestamp(),
        updatedAt: fsServerTimestamp()
      }, { merge: true });
    } catch (fsErr) {
      console.warn("Firestore password update timestamp error:", fsErr);
    }

    // Broadcast to update client states
    broadcast({ type: "USER_UPDATED", payload: targetUser });
    broadcast({ type: "SYNC_USERS", payload: serverUsers });

    return res.json({
      success: true,
      message: `تم تغيير كلمة مرور العضو (${targetUser.username}) وتشفيرها بنجاح`
    });
  } catch (error: any) {
    console.error("Change member password error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "حدث خطأ أثناء تغيير كلمة المرور في السيرفر"
    });
  }
});

// REST Endpoint to update site settings
app.post("/api/settings/update", (req, res) => {
  const { settings, requesterId, requesterRole } = req.body || {};

  // RBAC Server-side Verification: Only owner or admin can update site settings
  const requester = serverUsers.find(u => u.id === requesterId);
  const effectiveRole = getEffectiveUserRole(requester) || requesterRole;
  if (!['owner', 'admin'].includes(effectiveRole || '')) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized: Only Owner or Admin can update site settings"
    });
  }

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

// GET /api/server-time - Authoritative server time for clock-independent membership and duration calculations
app.get("/api/server-time", (req, res) => {
  const now = Date.now();
  res.json({
    success: true,
    serverTime: now,
    iso: new Date(now).toISOString(),
    formatted: formatServerDateTime(new Date(now))
  });
});

// POST /api/membership/upgrade - Upgrade user rank with 30-day validity or permanent (Owner only)
app.post("/api/membership/upgrade", async (req, res) => {
  try {
    const { userId, rank, assignedBy, permanent, requesterId } = req.body || {};

    if (!userId || !rank) {
      return res.status(400).json({ success: false, error: "بيانات الترقية غير مكتملة (userId, rank)" });
    }

    const validRanks = ['vip', 'moderator', 'management', 'admin', 'member', 'owner'];
    if (!validRanks.includes(rank)) {
      return res.status(400).json({ success: false, error: "الرتبة المحددة غير صالحة" });
    }

    const targetUserIdx = serverUsers.findIndex((u) => u.id === userId);
    if (targetUserIdx === -1) {
      return res.status(404).json({ success: false, error: "المستخدم غير موجود" });
    }
    const targetUser = serverUsers[targetUserIdx];

    // Absolute Primary Owner Protection: NEVER allow altering or demoting Primary Owner
    if (isPrimaryOwner(targetUser) || targetUser.id === PRIMARY_OWNER_ID) {
      return res.status(403).json({
        success: false,
        error: "🚫 رتبة صاحب الموقع الأساسي (Primary Owner) محمية بشكل دائم ومطلق، ولا يمكن تغييرها أو خفضها لأي سبب."
      });
    }

    const requester = serverUsers.find((u) => u.id === requesterId);

    // Rule: Only the Primary Owner can grant the 'owner' role to another user
    if (rank === 'owner' && !isPrimaryOwner(requester)) {
      return res.status(403).json({
        success: false,
        error: "🚫 صاحب الموقع الأساسي فقط من يملك صلاحية منح رتبة مالك (Owner) لمستخدمين آخرين."
      });
    }

    // Rule: If target is already an Owner (Granted Owner), only Primary Owner can modify or demote them
    if (targetUser.role === 'owner' && !isPrimaryOwner(requester)) {
      return res.status(403).json({
        success: false,
        error: "🚫 صاحب الموقع الأساسي فقط من يملك صلاحية تعديل أو خفض رتبة مالك آخر."
      });
    }

    // Rule 8: Permanent memberships are STRICTLY FORBIDDEN from the store!

    if (assignedBy === 'store') {
      if (permanent) {
        return res.status(403).json({ success: false, error: "🚫 العضوية الدائمة ليست متاحة من المتجر، ومخصصة للمالك فقط" });
      }
      if (rank !== 'vip') {
        return res.status(400).json({ success: false, error: "المتجر يتيح حالياً شراء رتبة مميز فقط" });
      }
      if (targetUser.role === 'visitor') {
        return res.status(400).json({ success: false, error: "قم بتسجيل عضوية أولاً لشراء رتبة من المتجر" });
      }
      const higherRoles = ['moderator', 'management', 'admin', 'owner'];
      if (higherRoles.includes(targetUser.role)) {
        return res.status(400).json({ success: false, error: "عضويتك الحالية أعلى من هذه العضوية" });
      }
      // Check coins (150 coins for 30-day VIP)
      const price = 150;
      if ((targetUser.coins || 0) < price) {
        return res.status(400).json({ success: false, error: `رصيدك الحالي (${targetUser.coins || 0} كوينز) لا يكفي لإتمام الشراء (المطلوب ${price} كوينز)` });
      }
      // Deduct coins
      targetUser.coins = (targetUser.coins || 0) - price;
    } else if (assignedBy === 'owner') {
      const isOwner = requester && (requester.role === 'owner' || requester.id === 'user-owner' || requester.email === 'alzymasd9@gmail.com');
      if (!isOwner) {
        return res.status(403).json({ success: false, error: "🚫 صلاحية ترقية وتحديد العضويات من لوحة التحكم مخصصة للمالك فقط" });
      }
    } else {
      return res.status(400).json({ success: false, error: "جهة الترقية غير صالحة" });
    }

    // Authoritative Server Time Calculation
    const now = Date.now();
    const isPermanent = !!permanent && assignedBy === 'owner';
    const durationDays = isPermanent ? 0 : 30;
    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    const expiresAt = isPermanent ? null : now + durationMs;

    // Archive previous active membership in history as 'replaced'
    if (!Array.isArray(targetUser.membershipHistory)) {
      targetUser.membershipHistory = [];
    }
    targetUser.membershipHistory.forEach((h) => {
      if (h.status === 'active') {
        h.status = 'replaced';
      }
    });

    // Create new active membership object
    const newMembership: any = {
      rank,
      status: 'active',
      startAt: now,
      expiresAt,
      durationDays: isPermanent ? 0 : durationDays,
      assignedBy,
      assignedByUserId: requesterId || (assignedBy === 'store' ? 'store' : 'owner'),
      assignedByUsername: assignedBy === 'store' ? 'متجر الدردشة' : (requester?.username || 'المالك'),
      permanent: isPermanent
    };

    const historyItem: any = {
      id: `mh-${now}-${Math.random().toString(36).substring(2, 7)}`,
      ...newMembership,
      status: 'active',
      createdAt: now
    };

    targetUser.membershipHistory.unshift(historyItem);
    targetUser.membership = newMembership;
    targetUser.role = rank;
    if (targetUser.id !== PRIMARY_OWNER_ID) {
      targetUser.isPrimaryOwner = false;
    }


    // Persist to D1 SQLite
    saveUserToD1(targetUser);

    // Sync to Firestore
    syncMembershipToFirestore(targetUser.id, newMembership, rank, targetUser.membershipHistory);

    // Notification for the upgraded user
    const roleTitle = getArabicRoleTitle(rank);
    const durationText = isPermanent ? 'رتبة دائمة ♾️ بدون تاريخ انتهاء' : 'لمدة 30 يوماً كاملة';
    const sourceText = assignedBy === 'store' ? 'عبر متجر الدردشة 🪙' : 'بواسطة المالك 👑';
    const notif: Notification = {
      id: `notif-upgrade-${now}-${targetUser.id}`,
      userId: targetUser.id,
      senderId: requesterId || 'system',
      senderName: assignedBy === 'store' ? 'متجر الدردشة' : (requester?.username || 'المالك'),
      senderAvatar: requester?.avatar || '',
      senderGender: requester?.gender || 'other',
      type: 'role_change',
      title: 'ترقية رتبة ✨',
      message: `تهانينا! تم منحك رتبة [ ${roleTitle} ] ${durationText} ${sourceText}.`,
      timestamp: formatServerDateTime(new Date(now)),
      isRead: false
    };
    serverNotifications.unshift(notif);
    saveNotificationToD1(notif);

    // Broadcast WebSocket updates
    broadcast({ type: "USER_UPDATED", payload: targetUser });
    broadcast({ type: "SYNC_USERS", payload: serverUsers });
    broadcast({ type: "NEW_NOTIFICATION", payload: notif });

    return res.json({
      success: true,
      user: targetUser,
      membership: newMembership,
      message: `تم ترقية المستخدم إلى [ ${roleTitle} ] ${durationText} بنجاح`
    });
  } catch (error: any) {
    console.error("Membership upgrade error:", error);
    return res.status(500).json({ success: false, error: error?.message || "Internal server error" });
  }
});

// POST /api/membership/cancel - Cancel active membership by Owner
app.post("/api/membership/cancel", async (req, res) => {
  try {
    const { userId, requesterId } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, error: "Missing userId" });

    const requester = serverUsers.find((u) => u.id === requesterId);
    const isOwner = requester && (requester.role === 'owner' || requester.id === 'user-owner' || requester.email === 'alzymasd9@gmail.com');
    if (!isOwner) {
      return res.status(403).json({ success: false, error: "غير مصرح: المالك فقط من يمكنه إلغاء العضويات" });
    }

    const targetUser = serverUsers.find((u) => u.id === userId);
    if (!targetUser) return res.status(404).json({ success: false, error: "المستخدم غير موجود" });

    // Absolute Primary Owner Protection: Cannot cancel or demote Primary Owner
    if (isPrimaryOwner(targetUser) || targetUser.id === PRIMARY_OWNER_ID) {
      return res.status(403).json({
        success: false,
        error: "🚫 لا يمكن إلغاء رتبة صاحب الموقع الأساسي (Primary Owner)؛ فرتبته دائمة ومحمية بشكل دائم ومطلق."
      });
    }

    // Granted Owner Protection: Only Primary Owner can cancel or revoke another owner's role
    if (targetUser.role === 'owner' && !isPrimaryOwner(requester)) {
      return res.status(403).json({
        success: false,
        error: "🚫 صاحب الموقع الأساسي فقط من يملك صلاحية إلغاء رتبة مالك آخر."
      });
    }

    if (targetUser.membership) {
      targetUser.membership.status = 'expired';
    }
    targetUser.role = 'member';

    if (Array.isArray(targetUser.membershipHistory)) {
      const activeItem = targetUser.membershipHistory.find((h) => h.status === 'active');
      if (activeItem) activeItem.status = 'expired';
    }

    saveUserToD1(targetUser);
    syncMembershipToFirestore(targetUser.id, targetUser.membership, 'member', targetUser.membershipHistory);

    broadcast({ type: "USER_UPDATED", payload: targetUser });
    broadcast({ type: "SYNC_USERS", payload: serverUsers });

    return res.json({ success: true, message: `تم إلغاء عضوية ${targetUser.username} وإعادته إلى عضو مسجل` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || "Internal server error" });
  }
});

// POST /api/membership/check - Check and verify active status of a user's membership
app.post("/api/membership/check", (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ success: false, error: "Missing userId" });

  const user = serverUsers.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  // Absolute Primary Owner Protection: NEVER expire Primary Owner, keep always permanent
  if (isPrimaryOwner(user) || user.id === PRIMARY_OWNER_ID) {
    user.role = 'owner';
    user.isPrimaryOwner = true;
    if (!user.membership) {
      user.membership = {
        rank: 'owner',
        status: 'active',
        permanent: true,
        startAt: Date.now(),
        expiresAt: null,
        durationDays: 0,
        assignedBy: 'system'
      };
    } else {

      user.membership.permanent = true;
      user.membership.expiresAt = null;
      user.membership.status = 'active';
      user.membership.rank = 'owner';
    }
    return res.json({
      success: true,
      user,
      effectiveRole: 'owner',
      serverTime: Date.now()
    });
  }

  // Run on-demand check for other users
  if (user.membership && user.membership.status === 'active' && !user.membership.permanent && user.membership.expiresAt) {

    if (Date.now() >= user.membership.expiresAt) {
      user.membership.status = 'expired';
      user.role = 'member';
      if (Array.isArray(user.membershipHistory)) {
        const activeHist = user.membershipHistory.find(h => h.status === 'active');
        if (activeHist) activeHist.status = 'expired';
      }
      saveUserToD1(user);
      syncMembershipToFirestore(user.id, user.membership, 'member', user.membershipHistory);
      broadcast({ type: "USER_UPDATED", payload: user });
      broadcast({ type: "SYNC_USERS", payload: serverUsers });
    }
  }

  const effectiveRole = getEffectiveUserRole(user);
  return res.json({
    success: true,
    user,
    effectiveRole,
    serverTime: Date.now()
  });
});

// REST Endpoint to update rooms
app.post("/api/rooms/update", (req, res) => {
  const { rooms, requesterId, requesterRole } = req.body || {};

  // RBAC Server-side Verification: Only staff (owner, admin, management) can update rooms
  const requester = serverUsers.find(u => u.id === requesterId);
  const effectiveRole = getEffectiveUserRole(requester) || requesterRole;
  if (!['owner', 'admin', 'management'].includes(effectiveRole || '')) {
    return res.status(403).json({
      success: false,
      error: "Unauthorized: Managing rooms requires owner, admin, or management role"
    });
  }

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

// Daily Scheduled Job / Cron Endpoint for Membership Expiry Verification
app.all("/api/cron/check-expired-memberships", (req, res) => {
  try {
    const expiredCount = checkAndExpireMemberships();
    res.json({
      success: true,
      job: "check-expired-memberships",
      expiredCount,
      timestamp: Date.now(),
      message: `تم فحص جميع العضويات وتحديث ${expiredCount} عضوية منتهية تلقائياً.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});


// ==========================================
// Robust Multi-Connection Presence Engine
// Source of Truth: Real-time Connection Sessions
// ==========================================

interface ConnectionSession {
  connectionId: string;
  userId: string;
  connectedAt: number;
  lastPing: number;
  userAgent?: string;
  ip?: string;
  ws: WebSocket;
}

class PresenceManager {
  // Map of userId -> Map<connectionId, ConnectionSession>
  private userSessions = new Map<string, Map<string, ConnectionSession>>();
  private socketMap = new WeakMap<WebSocket, Set<string>>();

  addConnection(userId: string, connectionId: string, ws: WebSocket, userAgent?: string, ip?: string): boolean {
    if (!userId || !connectionId) return false;
    let sessions = this.userSessions.get(userId);
    if (!sessions) {
      sessions = new Map();
      this.userSessions.set(userId, sessions);
    }
    const wasOnline = sessions.size > 0;
    sessions.set(connectionId, {
      connectionId,
      userId,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      userAgent,
      ip,
      ws
    });

    let connKeys = this.socketMap.get(ws);
    if (!connKeys) {
      connKeys = new Set();
      this.socketMap.set(ws, connKeys);
    }
    connKeys.add(`${userId}:::${connectionId}`);

    return !wasOnline;
  }

  recordPing(userId: string, connectionId: string) {
    const sessions = this.userSessions.get(userId);
    if (sessions && sessions.has(connectionId)) {
      sessions.get(connectionId)!.lastPing = Date.now();
    }
  }

  removeConnection(userId: string, connectionId: string): boolean {
    const sessions = this.userSessions.get(userId);
    if (!sessions) return false;
    sessions.delete(connectionId);
    if (sessions.size === 0) {
      this.userSessions.delete(userId);
      return true; // Transitioned to 0 connections -> offline
    }
    return false; // Still has other active connections in other tabs/devices -> remains online
  }

  removeSocket(ws: WebSocket): { userId: string; connectionId: string; becameOffline: boolean }[] {
    const connKeys = this.socketMap.get(ws);
    const results: { userId: string; connectionId: string; becameOffline: boolean }[] = [];
    if (connKeys) {
      for (const key of connKeys) {
        const [userId, connectionId] = key.split(":::");
        const becameOffline = this.removeConnection(userId, connectionId);
        results.push({ userId, connectionId, becameOffline });
      }
    }
    // Deep fallback scan
    for (const [userId, sessions] of this.userSessions.entries()) {
      for (const [connId, session] of sessions.entries()) {
        if (session.ws === ws) {
          sessions.delete(connId);
          const becameOffline = sessions.size === 0;
          if (becameOffline) {
            this.userSessions.delete(userId);
          }
          if (!results.some(r => r.userId === userId && r.connectionId === connId)) {
            results.push({ userId, connectionId: connId, becameOffline });
          }
        }
      }
    }
    return results;
  }

  getConnectionCount(userId: string): number {
    return this.userSessions.get(userId)?.size || 0;
  }

  isUserOnline(userId: string): boolean {
    if (userId === "user-system") return true; // System bot is permanent official entity
    return (this.userSessions.get(userId)?.size || 0) > 0;
  }

  getOnlineUserIds(): Set<string> {
    const set = new Set<string>();
    set.add("user-system"); // System entity always online
    for (const [userId, sessions] of this.userSessions.entries()) {
      if (sessions.size > 0) {
        set.add(userId);
      }
    }
    return set;
  }

  cleanupStaleConnections(timeoutMs = 60000): { userId: string; connectionId: string; becameOffline: boolean }[] {
    const now = Date.now();
    const pruned: { userId: string; connectionId: string; becameOffline: boolean }[] = [];
    for (const [userId, sessions] of this.userSessions.entries()) {
      for (const [connId, session] of sessions.entries()) {
        const isSocketDead = session.ws.readyState !== WebSocket.OPEN;
        const isTimedOut = (now - session.lastPing) > timeoutMs;
        if (isSocketDead || isTimedOut) {
          try {
            session.ws.terminate();
          } catch {}
          sessions.delete(connId);
          const becameOffline = sessions.size === 0;
          if (becameOffline) {
            this.userSessions.delete(userId);
          }
          pruned.push({ userId, connectionId: connId, becameOffline });
        }
      }
    }
    return pruned;
  }

  getActiveSessionsSummary() {
    const summary: Record<string, { count: number; connections: Array<{ id: string; ageMs: number; userAgent?: string }> }> = {};
    for (const [userId, sessions] of this.userSessions.entries()) {
      summary[userId] = {
        count: sessions.size,
        connections: Array.from(sessions.values()).map(s => ({
          id: s.connectionId,
          ageMs: Date.now() - s.connectedAt,
          userAgent: s.userAgent
        }))
      };
    }
    return summary;
  }
}

const presenceManager = new PresenceManager();

// Firestore Server-side Presence Sync
let firestoreInstance: any = null;
function getFirestoreDb() {
  if (!firestoreInstance) {
    try {
      const app = getClientApps().length > 0 ? getClientApps()[0] : initClientFirebase(firebaseConfig);
      firestoreInstance = getClientFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
    } catch (e) {
      console.warn("Firestore server init warning:", e);
    }
  }
  return firestoreInstance;
}

async function syncPresenceToFirestore(userId: string, isOnline: boolean, formattedTime?: string) {
  if (!userId) return;
  const fdb = getFirestoreDb();
  if (!fdb) return;
  try {
    const userRef = fsDoc(fdb, "users", userId);
    const isPrimary = userId === "user-owner";
    const primaryFields = isPrimary ? {
      role: "owner",
      isPrimaryOwner: true,
      is_primary_owner: true
    } : {};

    if (isOnline) {
      await fsSetDoc(userRef, {
        ...primaryFields,
        isOnline: true,
        onlineStatus: "online",
        lastSeen: "الآن",
        lastSeenTimestamp: Date.now(),
        updatedAt: fsServerTimestamp()
      }, { merge: true });
    } else {
      await fsSetDoc(userRef, {
        ...primaryFields,
        isOnline: false,
        onlineStatus: "offline",
        lastSeen: formattedTime || "غير متصل",
        lastSeenTimestamp: Date.now(),
        updatedAt: fsServerTimestamp()
      }, { merge: true });
    }
  } catch (err: any) {
    console.warn(`[syncPresenceToFirestore] Sync notice for ${userId}:`, err?.message || err);
  }
}

// Authoritative Online Users List
function getAuthoritativeOnlineUsers(): User[] {
  const onlineIds = presenceManager.getOnlineUserIds();
  return serverUsers.filter((u) => {
    if (u.id === "user-system") return true; // System entity is permanent
    return onlineIds.has(u.id) && u.onlineStatus !== "offline" && !u.isBanned;
  });
}

// Presence REST Endpoints
app.post("/api/presence/disconnect", express.text({ type: "*/*" }), (req, res) => {
  try {
    let payload: any = req.body;
    if (typeof payload === "string") {
      try { payload = JSON.parse(payload); } catch {}
    }
    const { userId, connectionId } = payload || {};
    if (userId && connectionId) {
      const becameOffline = presenceManager.removeConnection(userId, connectionId);
      if (becameOffline) {
        handleUserLeaving(userId);
      }
    }
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message });
  }
});

app.get("/api/presence/active", (req, res) => {
  res.json({
    activeUsersCount: presenceManager.getOnlineUserIds().size,
    onlineUserIds: Array.from(presenceManager.getOnlineUserIds()),
    sessions: presenceManager.getActiveSessionsSummary(),
    onlineUsersList: getAuthoritativeOnlineUsers().map(u => ({ id: u.id, username: u.username, role: u.role }))
  });
});

// Stale connection cleanup runner every 30 seconds
setInterval(() => {
  const pruned = presenceManager.cleanupStaleConnections(60000);
  if (pruned.length > 0) {
    for (const p of pruned) {
      if (p.becameOffline) {
        handleUserLeaving(p.userId);
      }
    }
  }
}, 30000);

// Periodic 15-minute reconciliation
setInterval(async () => {
  try {
    const activeIds = presenceManager.getOnlineUserIds();
    let updatedAny = false;
    for (const user of serverUsers) {
      if (user.id !== "user-system" && !activeIds.has(user.id) && user.onlineStatus === "online") {
        user.onlineStatus = "offline";
        user.isOnline = false;
        user.lastSeenTimestamp = Date.now();
        user.lastSeen = "قبل قليل";
        saveUserToD1(user);
        syncPresenceToFirestore(user.id, false, user.lastSeen);
        updatedAny = true;
      }
    }
    if (updatedAny) {
      broadcast({ type: "UPDATE_ONLINE_USERS", payload: getAuthoritativeOnlineUsers() });
    }
  } catch (err) {
    console.warn("Presence reconciliation error:", err);
  }
}, 15 * 60 * 1000);

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

// Arabic Role Title mapping
function getArabicRoleTitle(role: string): string {
  const map: Record<string, string> = {
    visitor: 'زائر',
    member: 'عضو مسجل',
    vip: 'مميز',
    moderator: 'مشرف',
    management: 'إدارة',
    admin: 'ادمن',
    owner: 'مالك'
  };
  return map[role] || role;
}

// Sync membership changes to Firestore doc & subcollection membershipHistory
async function syncMembershipToFirestore(userId: string, membership: any, role: string, membershipHistory?: any[]) {
  if (!userId) return;
  const fdb = getFirestoreDb();
  if (!fdb) return;
  try {
    const userRef = fsDoc(fdb, "users", userId);
    await fsSetDoc(userRef, {
      role,
      membership: membership || null,
      membershipHistory: membershipHistory || null,
      updatedAt: fsServerTimestamp()
    }, { merge: true });

    // Also persist audit record to the sub-collection users/{userId}/membershipHistory/{historyId}
    if (Array.isArray(membershipHistory) && membershipHistory.length > 0) {
      const latest = membershipHistory[0];
      if (latest && latest.id) {
        const historyRef = fsDoc(fdb, "users", userId, "membershipHistory", latest.id);
        await fsSetDoc(historyRef, {
          id: latest.id,
          userId,
          rank: latest.rank || role,
          assignedBy: latest.assignedBy || 'system',
          assignedByUserId: latest.assignedByUserId || null,
          assignedByUsername: latest.assignedByUsername || null,
          startAt: latest.startAt || Date.now(),
          expiresAt: latest.expiresAt || null,
          durationDays: latest.durationDays || 30,
          permanent: Boolean(latest.permanent),
          status: latest.status || 'active',
          notes: latest.notes || 'تحديث تلقائي لحالة العضوية',
          createdAt: fsServerTimestamp()
        }, { merge: true });
      }
    }
  } catch (err: any) {
    console.warn(`[syncMembershipToFirestore] Firestore error for ${userId}:`, err?.message || err);
  }
}

// Server-side authoritative effective role resolver
// Checks membership status, expiration, and permanent flag.
// If temporary membership has expired, returns 'member' immediately!
function getEffectiveUserRole(user?: User | null): string {
  if (!user) return 'visitor';
  if (isPrimaryOwner(user) || user.id === PRIMARY_OWNER_ID) return 'owner';
  if (user.role === 'owner' || user.is_super_admin) return 'owner';

  if (user.membership) {
    if (user.membership.permanent) {
      return user.membership.rank || user.role;
    }
    const now = Date.now();
    if (user.membership.expiresAt && now >= user.membership.expiresAt) {
      return 'member';
    }
    if (user.membership.status === 'active') {
      return user.membership.rank || user.role;
    }
  }
  return user.role || 'member';
}

// Background Membership Expiry Worker (Runs every 10 seconds & scheduled daily)
// Checks if expiresAt <= serverTime for all users. If expired:
// 1. Reverts user to عضو مسجل ('member')
// 2. Marks membership.status = 'expired'
// 3. Archives active history item as 'expired' & creates audit trail
// 4. Persists to SQLite D1
// 5. Syncs to Firestore users/{userId} and sub-collection membershipHistory
// 6. Issues an automated notification
// 7. Broadcasts WebSocket updates so all clients update instantly without page refresh!
function checkAndExpireMemberships(): number {
  let expiredCount = 0;
  try {
    const now = Date.now();
    let anyExpired = false;

    for (let i = 0; i < serverUsers.length; i++) {
      const user = serverUsers[i];
      if (!user) continue;

      // Absolute Primary Owner Protection: NEVER expire Primary Owner!
      if (isPrimaryOwner(user) || user.id === PRIMARY_OWNER_ID) {
        user.role = 'owner';
        user.isPrimaryOwner = true;
        if (!user.membership) {
          user.membership = {
            rank: 'owner',
            status: 'active',
            permanent: true,
            startAt: Date.now(),
            expiresAt: null,
            durationDays: 0,
            assignedBy: 'system'
          };
        } else {

          user.membership.permanent = true;
          user.membership.expiresAt = null;
          user.membership.status = 'active';
          user.membership.rank = 'owner';
        }
        continue;
      }

      if (
        user.membership &&
        user.membership.status === 'active' &&
        !user.membership.permanent &&
        user.membership.expiresAt &&
        now >= user.membership.expiresAt
      ) {

        const oldRank = user.membership.rank || user.role;
        console.log(`⏰ [Membership Expired] User: ${user.username} (${user.id}), previous rank: ${oldRank} -> downgraded to 'member'`);

        user.membership.status = 'expired';
        user.role = 'member';

        if (!Array.isArray(user.membershipHistory)) {
          user.membershipHistory = [];
        }

        const activeItem = user.membershipHistory.find(h => h.status === 'active');
        if (activeItem) {
          activeItem.status = 'expired';
        }

        // Add audit history record
        const auditItem: any = {
          id: `mh-exp-${now}-${user.id}`,
          userId: user.id,
          rank: oldRank,
          startAt: user.membership.startAt || now - (30 * 24 * 60 * 60 * 1000),
          expiresAt: user.membership.expiresAt,
          durationDays: user.membership.durationDays || 30,
          assignedBy: user.membership.assignedBy || 'system',
          assignedByUsername: 'الجدولة التلقائية لانتهاء الصلاحية',
          permanent: false,
          status: 'expired',
          notes: 'انتهت مدة العضوية (30 يوماً) وتم التحويل إلى عضو مسجل تلقائياً',
          createdAt: now
        };
        user.membershipHistory.unshift(auditItem);

        saveUserToD1(user);
        syncMembershipToFirestore(user.id, user.membership, 'member', user.membershipHistory);

        const expNotif: Notification = {
          id: `notif-exp-${now}-${user.id}`,
          userId: user.id,
          senderId: 'system',
          senderName: 'إدارة العضويات',
          senderAvatar: '',
          senderGender: 'other',
          type: 'role_change',
          title: 'انتهاء العضوية ⏰',
          message: `انتهت مدة اشتراكك في رتبة [ ${getArabicRoleTitle(oldRank)} ] (30 يوماً). تم تحويل حسابك تلقائياً إلى [ عضو مسجل ].`,
          timestamp: formatServerDateTime(new Date(now)),
          isRead: false
        };
        serverNotifications.unshift(expNotif);
        saveNotificationToD1(expNotif);

        broadcast({ type: "USER_UPDATED", payload: user });
        broadcast({ type: "NEW_NOTIFICATION", payload: expNotif });
        anyExpired = true;
        expiredCount++;
      }
    }

    if (anyExpired) {
      broadcast({ type: "SYNC_USERS", payload: serverUsers });
    }
  } catch (err) {
    console.error("Error in checkAndExpireMemberships:", err);
  }
  return expiredCount;
}

// Run expiration worker every 10 seconds in server background
setInterval(checkAndExpireMemberships, 10 * 1000);


function handleUserLeaving(userId: string, isVisitor?: boolean) {
  if (!userId) return;
  // If user still has active connections in other tabs/devices, stay online!
  if (presenceManager.isUserOnline(userId) && userId !== "user-system") {
    return;
  }

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
    try {
      const fdb = getFirestoreDb();
      if (fdb) {
        fsDeleteDoc(fsDoc(fdb, "users", userId)).catch(() => {});
      }
    } catch {}
  } else {
    // 2. Registered member: mark offline, update lastSeen, save to database & sync to Firestore
    // Note: Disconnects (e.g. page refresh, network drop) MUST NOT emit room leave events!
    const now = new Date();
    const formattedTime = formatServerDateTime(now);
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

    syncPresenceToFirestore(userId, false, formattedTime);
  }

  // 3. Broadcast departure and authoritative updated presence lists
  broadcast({ type: "USER_LEFT", payload: { userId } });
  broadcast({ type: "SYNC_USERS", payload: serverUsers });
  broadcast({ type: "UPDATE_ONLINE_USERS", payload: getAuthoritativeOnlineUsers() });
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
  broadcast({ type: "UPDATE_ONLINE_USERS", payload: getAuthoritativeOnlineUsers() });
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
        guestBans: serverGuestBans,
      },
    })
  );

  ws.on("message", async (rawMessage: Buffer | string) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      const { type, payload } = data;

      switch (type) {
        case "REGISTER_CONNECTION": {
          const { userId, connectionId, userAgent, currentRoomId } = payload || {};
          if (userId && connectionId) {
            currentUserId = userId;
            const clientIp = (ws as any)._clientIp || "127.0.0.1";
            const becameOnline = presenceManager.addConnection(userId, connectionId, ws, userAgent, clientIp);

            const existingIdx = serverUsers.findIndex((u) => u.id === userId);
            if (existingIdx !== -1) {
              const u = serverUsers[existingIdx];
              serverUsers[existingIdx] = {
                ...u,
                onlineStatus: "online",
                isOnline: true,
                lastSeen: formatServerDateTime(new Date()),
                lastSeenTimestamp: Date.now(),
                currentRoomId: currentRoomId || u.currentRoomId || "room-general"
              };
              saveUserToD1(serverUsers[existingIdx]);
            }

            if (becameOnline) {
              syncPresenceToFirestore(userId, true);
              broadcast({ type: "USER_CONNECTED", payload: { userId } });
            }

            broadcast({ type: "SYNC_USERS", payload: serverUsers });
            broadcast({ type: "UPDATE_ONLINE_USERS", payload: getAuthoritativeOnlineUsers() });

            ws.send(JSON.stringify({
              type: "CONNECTION_REGISTERED",
              payload: {
                connectionId,
                userId,
                activeConnections: presenceManager.getConnectionCount(userId)
              }
            }));
          }
          break;
        }

        case "DISCONNECT_CONNECTION": {
          const { userId, connectionId } = payload || {};
          if (userId && connectionId) {
            const becameOffline = presenceManager.removeConnection(userId, connectionId);
            if (becameOffline) {
              handleUserLeaving(userId);
            }
          }
          break;
        }

        case "HEARTBEAT": {
          const { userId, connectionId } = payload || {};
          if (userId && connectionId) {
            presenceManager.recordPing(userId, connectionId);
          }
          ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
          break;
        }

        case "JOIN_USER": {
          const user: User = payload?.user;
          const connectionId: string | undefined = payload?.connectionId;
          if (user) {
            currentUserId = user.id;
            let becameOnline = false;
            if (connectionId) {
              const clientIp = (ws as any)._clientIp || "127.0.0.1";
              becameOnline = presenceManager.addConnection(user.id, connectionId, ws, undefined, clientIp);
            }

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
                  lastSeen: formatServerDateTime(new Date()),
                  lastSeenTimestamp: Date.now(),
                }
              : {
                  ...user,
                  currentRoomId: user.currentRoomId || 'room-general',
                  onlineStatus: "online" as const,
                  isOnline: true,
                  lastSeen: formatServerDateTime(new Date()),
                  lastSeenTimestamp: Date.now(),
                };

            if (existingIdx !== -1) {
              serverUsers[existingIdx] = updatedUser;
            } else {
              serverUsers.push(updatedUser);
            }

            saveUserToD1(updatedUser);
            if (becameOnline) {
              syncPresenceToFirestore(user.id, true);
            }
            broadcast({ type: "SYNC_USERS", payload: serverUsers });
            broadcast({ type: "UPDATE_ONLINE_USERS", payload: getAuthoritativeOnlineUsers() });
            ws.send(JSON.stringify({ type: "USER_UPDATED", payload: updatedUser }));
          }
          break;
        }

        case "USER_LOGOUT": {
          const { userId, isVisitor } = payload || {};
          if (userId) {
            const user = serverUsers.find((u) => u.id === userId);
            if (user && user.currentRoomId) {
              const now = new Date();
              const leaveEvt: RoomEvent = {
                id: `evt-leave-${user.id}-${user.currentRoomId}-${Date.now()}`,
                type: "room_event",
                eventType: "leave",
                userId: user.id,
                username: user.username,
                text: `غادر المستخدم ${user.username} الغرفة`,
                rank: user.role,
                roomId: user.currentRoomId,
                avatar: user.avatar,
                gender: user.gender,
                usernameColor: user.usernameColor,
                createdAt: now.getTime(),
                timestamp: formatServerDateTime(now)
              };
              broadcast({ type: "ROOM_EVENT", payload: leaveEvt });
            }

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
            // Absolute Primary Owner Protection: Immutable Sovereign Role
            if (isPrimaryOwner(updatedUser.id) || updatedUser.id === PRIMARY_OWNER_ID) {
              updatedUser.id = PRIMARY_OWNER_ID;
              updatedUser.role = 'owner';
              updatedUser.isPrimaryOwner = true;
              if (updatedUser.membership) {
                updatedUser.membership.rank = 'owner';
                updatedUser.membership.permanent = true;
                updatedUser.membership.expiresAt = null;
                updatedUser.membership.status = 'active';
              }
            }
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
            const now = new Date();
            const nowTime = formatServerDateTime(now);
            const user = serverUsers.find((u) => u.id === userId);

            serverUsers = serverUsers.map((u) =>
              u.id === userId ? { ...u, currentRoomId: toRoomId, onlineStatus: "online" as const, lastSeen: nowTime, lastSeenTimestamp: now.getTime() } : u
            );
            const found = serverUsers.find((u) => u.id === userId);
            if (found) {
               saveUserToD1(found);
            }

            // Server-authoritative Room leave & join events (typed room_event)
            // Separated from chat messages, not stored in persistent messages table
            if (user && fromRoomId && fromRoomId !== toRoomId) {
              const leaveEvt: RoomEvent = {
                id: `evt-leave-${user.id}-${fromRoomId}-${Date.now()}`,
                type: 'room_event',
                eventType: 'leave',
                userId: user.id,
                username: user.username,
                text: `غادر المستخدم ${user.username} الغرفة`,
                rank: user.role,
                roomId: fromRoomId,
                avatar: user.avatar,
                gender: user.gender,
                usernameColor: user.usernameColor,
                createdAt: now.getTime(),
                timestamp: nowTime
              };
              broadcast({ type: "ROOM_EVENT", payload: leaveEvt });
              broadcast({ type: "NEW_MESSAGE", payload: leaveEvt });
            }

            if (user && toRoomId && fromRoomId !== toRoomId) {
              const joinEvt: RoomEvent = {
                id: `evt-join-${user.id}-${toRoomId}-${Date.now()}`,
                type: 'room_event',
                eventType: 'join',
                userId: user.id,
                username: user.username,
                text: `انظم المستخدم ${user.username} الى الغرفة`,
                rank: user.role,
                roomId: toRoomId,
                avatar: user.avatar,
                gender: user.gender,
                usernameColor: user.usernameColor,
                createdAt: now.getTime(),
                timestamp: nowTime
              };
              broadcast({ type: "ROOM_EVENT", payload: joinEvt });
              broadcast({ type: "NEW_MESSAGE", payload: joinEvt });
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
          const { messageId, userId } = payload || {};
          const sender = (userId || currentUserId) ? serverUsers.find(u => u.id === (userId || currentUserId)) : null;
          if (messageId) {
            const targetMsg = serverMessages.find(m => m.id === messageId);
            if (targetMsg && sender) {
              const isSender = targetMsg.senderId === sender.id;
              const isStaff = ["owner", "admin", "management", "moderator"].includes(getEffectiveUserRole(sender));
              if (!isSender && !isStaff) {
                console.warn(`[RBAC Block] User ${sender.id} (${sender.role}) unauthorized to delete message ${messageId}`);
                break;
              }
            }
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
          const { roomId, userId } = payload || {};
          const requester = (userId || currentUserId) ? serverUsers.find(u => u.id === (userId || currentUserId)) : null;
          const targetRoom = serverRooms.find(r => r.id === roomId);
          const isRoomMaster = targetRoom && requester && targetRoom.createdBy === requester.id;
          const isStaff = requester && ["owner", "admin", "management", "moderator"].includes(getEffectiveUserRole(requester));
          if (!isStaff && !isRoomMaster) {
            console.warn(`[RBAC Block] User ${requester?.id} (${requester?.role}) unauthorized to clear chat in ${roomId}`);
            break;
          }
          if (roomId) {
            serverMessages = serverMessages.filter((m) => m.roomId !== roomId);
            clearRoomFromD1(roomId);
            broadcast({ type: "CHAT_CLEARED", payload: { roomId } });
          }
          break;
        }

        case "UPDATE_ROOMS": {
          const requester = currentUserId ? serverUsers.find(u => u.id === currentUserId) : null;
          const isStaff = requester && ["owner", "admin", "management"].includes(getEffectiveUserRole(requester));
          if (!isStaff) {
            console.warn(`[RBAC Block] Non-staff ${currentUserId} attempted to UPDATE_ROOMS`);
            break;
          }
          if (Array.isArray(payload)) {
            serverRooms = payload;
            saveRoomsToD1(serverRooms);
            broadcast({ type: "SYNC_ROOMS", payload: serverRooms });
          }
          break;
        }

        case "ROOM_KICK_EVENT": {
          const { roomId, userId, targetRoomName, fallbackRoomId, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const targetUser = serverUsers.find(u => u.id === userId);
          // Never allow kicking owner or primary owner
          if (isPrimaryOwner(userId) || isPrimaryOwner(targetUser) || (targetUser && (targetUser.role === 'owner' || targetUser.id === PRIMARY_OWNER_ID || targetUser.username.toLowerCase() === 'owner'))) {
            console.warn(`[RBAC Block] Prevented attempt to kick owner ${userId}`);
            break;
          }

          const targetRoom = serverRooms.find(r => r.id === roomId);
          const isRoomMaster = targetRoom && requester && targetRoom.createdBy === requester.id;
          const isStaff = requester && ["owner", "admin", "management", "moderator"].includes(getEffectiveUserRole(requester));
          if (!isStaff && !isRoomMaster) {
            console.warn(`[RBAC Block] Unauthorized kick attempt by ${requester?.id}`);
            break;
          }
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
          const { roomId, userId, targetRoomName, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const targetUser = serverUsers.find(u => u.id === userId);
          // Never allow muting owner or primary owner
          if (isPrimaryOwner(userId) || isPrimaryOwner(targetUser) || (targetUser && (targetUser.role === 'owner' || targetUser.id === PRIMARY_OWNER_ID || targetUser.username.toLowerCase() === 'owner'))) {
            console.warn(`[RBAC Block] Prevented attempt to mute owner ${userId}`);
            break;
          }

          const targetRoom = serverRooms.find(r => r.id === roomId);
          const isRoomMaster = targetRoom && requester && targetRoom.createdBy === requester.id;
          const isStaff = requester && ["owner", "admin", "management", "moderator"].includes(getEffectiveUserRole(requester));
          if (!isStaff && !isRoomMaster) {
            console.warn(`[RBAC Block] Unauthorized mute attempt by ${requester?.id}`);
            break;
          }
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
          const { roomId, userId, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const targetRoom = serverRooms.find(r => r.id === roomId);
          const isRoomMaster = targetRoom && requester && targetRoom.createdBy === requester.id;
          const isStaff = requester && ["owner", "admin", "management", "moderator"].includes(requester.role || "");
          if (!isStaff && !isRoomMaster) {
            console.warn(`[RBAC Block] Unauthorized unmute attempt by ${requester?.id}`);
            break;
          }
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
          const { roomId, userId, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const targetRoom = serverRooms.find(r => r.id === roomId);
          const isRoomMaster = targetRoom && requester && targetRoom.createdBy === requester.id;
          const isStaff = requester && ["owner", "admin", "management", "moderator"].includes(requester.role || "");
          if (!isStaff && !isRoomMaster) {
            console.warn(`[RBAC Block] Unauthorized unkick attempt by ${requester?.id}`);
            break;
          }
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
          const { title, message, soundType, senderName, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const isStaff = requester && ["owner", "admin", "management"].includes(getEffectiveUserRole(requester));
          if (!isStaff) {
            console.warn(`[RBAC Block] Unauthorized user ${requester?.id} attempted to BROADCAST_AUDIO_ALERT`);
            break;
          }
          broadcast({
            type: "BROADCAST_AUDIO_ALERT",
            payload: {
              title: title || "تنبيه عام من الإدارة 📢",
              message: message || "إشعار صوتي وإداري عام لجميع المتصلين",
              soundType: soundType || "general_broadcast",
              senderName: senderName || requester?.username || "الإدارة"
            }
          });
          break;
        }

        case "ADD_IP_MODERATION": {
          const record: IPModerationRecord = payload;
          const requester = currentUserId ? serverUsers.find(u => u.id === currentUserId) : null;
          const isStaff = requester && ["owner", "admin", "management"].includes(getEffectiveUserRole(requester));
          if (!isStaff) {
            console.warn(`[RBAC Block] Unauthorized user ${currentUserId} attempted to ADD_IP_MODERATION`);
            break;
          }
          if (record && (record.ip === '197.220.12.89' || record.targetUserId === 'user-owner' || record.targetUsername?.toLowerCase() === 'owner')) {
            console.warn(`[RBAC Block] Prevented banning Owner IP or Owner account`);
            break;
          }
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
          const { userId, ip, reason, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const isStaff = requester && ["owner", "admin", "management"].includes(getEffectiveUserRole(requester));
          if (!isStaff) {
            console.warn(`[RBAC Block] Unauthorized user ${requester?.id} attempted BAN_USER`);
            break;
          }
          if (isPrimaryOwner(userId) || userId === PRIMARY_OWNER_ID || userId === 'owner') {
            console.warn(`[RBAC Block] Prevented attempt to ban Primary Owner account`);
            break;
          }

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
          const { userId, ip, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const isStaff = requester && ["owner", "admin", "management"].includes(getEffectiveUserRole(requester));
          if (!isStaff) {
            console.warn(`[RBAC Block] Unauthorized user ${requester?.id} attempted UNBAN_USER`);
            break;
          }
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
          const { idOrIp, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const isStaff = requester && ["owner", "admin", "management"].includes(getEffectiveUserRole(requester));
          if (!isStaff) {
            console.warn(`[RBAC Block] Unauthorized user ${requester?.id} attempted REMOVE_IP_MODERATION`);
            break;
          }
          if (idOrIp) {
            serverIPModerations = serverIPModerations.filter(r => r.id !== idOrIp && r.ip !== idOrIp);
            deleteIPModerationFromD1(idOrIp);
            broadcast({ type: "SYNC_IP_MODERATIONS", payload: serverIPModerations });
          }
          break;
        }

        case "DELETE_USER_ACCOUNT": {
          const { userId, initiatorId } = payload || {};
          const requester = (initiatorId || currentUserId) ? serverUsers.find(u => u.id === (initiatorId || currentUserId)) : null;
          const isSelf = requester && requester.id === userId;
          const isStaff = requester && ["owner", "admin"].includes(getEffectiveUserRole(requester));
          if (!isSelf && !isStaff) {
            console.warn(`[RBAC Block] Unauthorized attempt to delete account ${userId} by ${requester?.id}`);
            break;
          }
          if (userId) {
            const target = serverUsers.find((u) => u.id === userId);
            // Absolute Primary Owner Protection
            if (isPrimaryOwner(target) || isPrimaryOwner(userId) || userId === PRIMARY_OWNER_ID) {
              console.warn(`[RBAC Block] Blocked attempt to delete Primary Owner account ${userId}`);
              break;
            }
            // Granted Owner protection: only Primary Owner can delete a Granted Owner
            if (target && target.role === 'owner' && !isPrimaryOwner(requester)) {
              console.warn(`[RBAC Block] Only Primary Owner can delete a Granted Owner account`);
              break;
            }
            if (target && target.is_super_admin && !isPrimaryOwner(requester)) {
              console.warn(`[RBAC Block] Cannot delete Super Admin account`);
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
          const requester = currentUserId ? serverUsers.find(u => u.id === currentUserId) : null;
          const isOwnerOrAdmin = requester && ["owner", "admin"].includes(getEffectiveUserRole(requester));
          if (!isOwnerOrAdmin) {
            console.warn(`[RBAC Block] Unauthorized user ${currentUserId} attempted to UPDATE_SETTINGS`);
            break;
          }
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
          const requester = currentUserId ? serverUsers.find(u => u.id === currentUserId) : null;
          const isStaff = requester && ["owner", "admin", "management", "moderator"].includes(getEffectiveUserRole(requester));
          if (!isStaff) {
            console.warn(`[RBAC Block] Unauthorized user ${currentUserId} attempted to ADD_NEWS_POST`);
            break;
          }
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
          const requester = currentUserId ? serverUsers.find(u => u.id === currentUserId) : null;
          const isStaff = requester && ["owner", "admin", "management", "moderator"].includes(getEffectiveUserRole(requester));
          if (!isStaff) {
            console.warn(`[RBAC Block] Unauthorized user ${currentUserId} attempted to DELETE_NEWS_POST`);
            break;
          }
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
    const offlineTransitions = presenceManager.removeSocket(ws);
    for (const t of offlineTransitions) {
      if (t.becameOffline) {
        handleUserLeaving(t.userId);
      }
    }
    if (currentUserId && presenceManager.getConnectionCount(currentUserId) === 0) {
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
