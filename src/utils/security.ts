/**
 * Security and Cryptographic Utilities
 * Provides SHA-256 password hashing, token generation, username normalization, and duplicate checks.
 */

// SHA-256 Hash using Web Crypto API (Browser) and Fallback for Node/Isomorphic
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(`arabsyemen_salt_2026_${password}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `sha256:${hashHex}`;
    }
  } catch (e) {
    console.warn('Web Crypto SHA-256 error, using fallback:', e);
  }

  // Pure JavaScript SHA-256 fallback implementation
  return `sha256:${simpleSha256Fallback(`arabsyemen_salt_2026_${password}`)}`;
}

// Synchronous password verifier that supports legacy passwords and hashed passwords
export function verifyPasswordMatch(inputPlain: string, storedPass?: string): boolean {
  if (!storedPass || !inputPlain) return false;
  
  // If stored password is plain text (legacy accounts like '123')
  if (!storedPass.startsWith('sha256:')) {
    return inputPlain === storedPass;
  }

  // If stored password is hashed, compare with sync fallback hash
  const computedHash = `sha256:${simpleSha256Fallback(`arabsyemen_salt_2026_${inputPlain}`)}`;
  return computedHash.toLowerCase() === storedPass.toLowerCase();
}

// Generate Secure Session Token
export function generateAuthToken(userId: string): string {
  const rand = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return `token_${userId}_${rand}`;
}

// Normalize username for strict duplicate detection (handles Arabic diacritics, spaces, alefs)
export function normalizeUsername(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic tashkeel/diacritics
    .replace(/[إأآا]/g, 'ا') // normalize alefs
    .replace(/ة/g, 'ه') // normalize ta marbuta
    .replace(/ى/g, 'ي') // normalize alef maksura
    .replace(/\s+/g, ' '); // collapse multiple spaces
}

// Check if a username is a duplicate
export function isDuplicateUsername(
  targetName: string,
  existingUsers: { id?: string; username: string }[],
  currentUserIdToExclude?: string
): boolean {
  const normTarget = normalizeUsername(targetName);
  if (!normTarget) return false;

  return existingUsers.some(u => {
    if (currentUserIdToExclude && u.id === currentUserIdToExclude) return false;
    return normalizeUsername(u.username) === normTarget;
  });
}

// Simple SHA-256 Fallback algorithm for pure JS sync execution
function simpleSha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii.length; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << ((3 - (i % 4)) * 8);
  }

  for (let block = 0; block < words.length; block += 16) {
    const w = new Array(64);
    for (i = 0; i < 16; i++) w[i] = words[block + i] | 0;
    for (i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}
