// import * as bcrypt from "bcryptjs";

/**
 * DEBUB MOCK: Temporarily using a simple mock to isolate "setTimeout" error in Convex.
 * DO NOT use this in production.
 */
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToBase64(bytes: Uint8Array): string {
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
        const a = bytes[i];
        const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const c = i + 2 < bytes.length ? bytes[i + 2] : 0;

        const triple = (a << 16) | (b << 8) | c;
        out += BASE64_ALPHABET[(triple >> 18) & 63];
        out += BASE64_ALPHABET[(triple >> 12) & 63];
        out += i + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 63] : "=";
        out += i + 2 < bytes.length ? BASE64_ALPHABET[triple & 63] : "=";
    }
    return out;
}

function base64ToBytes(b64: string): Uint8Array {
    const clean = b64.replace(/\s+/g, "");
    if (clean.length % 4 !== 0) throw new Error("Invalid base64");

    let padding = 0;
    if (clean.endsWith("==")) padding = 2;
    else if (clean.endsWith("=")) padding = 1;

    const outLen = (clean.length / 4) * 3 - padding;
    const out = new Uint8Array(outLen);

    let outIndex = 0;
    for (let i = 0; i < clean.length; i += 4) {
        const c0 = clean[i];
        const c1 = clean[i + 1];
        const c2 = clean[i + 2];
        const c3 = clean[i + 3];

        const i0 = BASE64_ALPHABET.indexOf(c0);
        const i1 = BASE64_ALPHABET.indexOf(c1);
        const i2 = c2 === "=" ? 0 : BASE64_ALPHABET.indexOf(c2);
        const i3 = c3 === "=" ? 0 : BASE64_ALPHABET.indexOf(c3);
        if (i0 < 0 || i1 < 0 || (c2 !== "=" && i2 < 0) || (c3 !== "=" && i3 < 0)) {
            throw new Error("Invalid base64");
        }

        const triple = (i0 << 18) | (i1 << 12) | (i2 << 6) | i3;
        if (outIndex < out.length) out[outIndex++] = (triple >> 16) & 255;
        if (c2 !== "=" && outIndex < out.length) out[outIndex++] = (triple >> 8) & 255;
        if (c3 !== "=" && outIndex < out.length) out[outIndex++] = triple & 255;
    }

    return out;
}

export async function hashPassword(password: string) {
    const iterations = 210_000;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordBytes = new TextEncoder().encode(password);
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        toArrayBuffer(passwordBytes),
        { name: "PBKDF2" },
        false,
        ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: toArrayBuffer(salt),
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        256,
    );

    const hash = new Uint8Array(bits);
    const saltB64 = bytesToBase64(salt);
    const hashB64 = bytesToBase64(hash);
    return `pbkdf2$${iterations}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password: string, hash: string) {
    if (hash.startsWith("p_hash:")) {
        return hash === "p_hash:" + password;
    }

    if (!hash.startsWith("pbkdf2$")) {
        return false;
    }

    const parts = hash.split("$");
    if (parts.length !== 4) return false;

    const iterations = Number(parts[1]);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;

    let salt: Uint8Array;
    let expected: Uint8Array;
    try {
        salt = base64ToBytes(parts[2]);
        expected = base64ToBytes(parts[3]);
    } catch {
        return false;
    }

    const passwordBytes = new TextEncoder().encode(password);
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        toArrayBuffer(passwordBytes),
        { name: "PBKDF2" },
        false,
        ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: toArrayBuffer(salt),
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        256,
    );

    const actual = new Uint8Array(bits);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
}
