import crypto from "crypto";

const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";
const JWT_SECRET = process.env.JWT_SECRET || "orbital-command-console-secure-secret-key-98765";

/**
 * Hashes a plaintext password using PBKDF2.
 * Returns salt and hash joined by colon.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 salt:hash.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  try {
    const parts = storedValue.split(":");
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
    return hash === originalHash;
  } catch (e) {
    return false;
  }
}

/**
 * Signs a payload as a JWT string with a 24-hour expiration duration.
 */
export function signToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
    })
  ).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${data}`)
    .digest("base64url");
    
  return `${header}.${data}.${signature}`;
}

/**
 * Verifies a JWT token, returning the decoded payload if valid or null if expired/invalid.
 */
export function verifyToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${data}`)
      .digest("base64url");
      
    if (signature !== expectedSig) return null;
    
    const decoded = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (decoded.exp && Date.now() > decoded.exp) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
}
