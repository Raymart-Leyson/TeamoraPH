import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Generate a cryptographically secure device token.
 *
 * Returns:
 *   raw   – 64-char hex string. Send to the device, never store it.
 *   hash  – SHA-256 of raw. Store this in the DB.
 */
export function generateDeviceToken(): { raw: string; hash: string } {
    const raw = randomBytes(32).toString("hex");
    return { raw, hash: sha256(raw) };
}

/**
 * Generate a short, human-typeable pairing code.
 * 8 uppercase alphanumeric characters (A-Z, 0-9), no ambiguous chars (0/O, 1/I/L).
 *
 * Returns:
 *   raw   – 8-char string. Show to the user once, never store it.
 *   hash  – SHA-256 of raw. Store this in the DB.
 */
export function generatePairingCode(): { raw: string; hash: string } {
    // Alphabet without ambiguous characters
    const ALPHABET = "ACDEFGHJKLMNPQRSTUVWXYZ2345679";
    const bytes = randomBytes(8);
    let raw = "";
    for (let i = 0; i < 8; i++) {
        raw += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return { raw, hash: sha256(raw) };
}

/** SHA-256 hex digest */
export function sha256(input: string): string {
    return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Timing-safe comparison of a raw value against a stored SHA-256 hash.
 * Prevents timing attacks when validating tokens or pairing codes.
 */
export function verifyAgainstHash(raw: string, storedHash: string): boolean {
    const computedHash = sha256(raw);
    const a = Buffer.from(computedHash, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}
