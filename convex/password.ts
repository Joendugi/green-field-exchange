// import * as bcrypt from "bcryptjs";

/**
 * DEBUB MOCK: Temporarily using a simple mock to isolate "setTimeout" error in Convex.
 * DO NOT use this in production.
 */
export async function hashPassword(password: string) {
    const iterations = 210_000;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        256,
    );

    const hash = new Uint8Array(bits);
    const saltB64 = btoa(String.fromCharCode(...salt));
    const hashB64 = btoa(String.fromCharCode(...hash));
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

    const salt = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));
    const expected = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0));

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"],
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
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
