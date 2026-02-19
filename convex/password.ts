// import * as bcrypt from "bcryptjs";

/**
 * DEBUB MOCK: Temporarily using a simple mock to isolate "setTimeout" error in Convex.
 * DO NOT use this in production.
 */
export async function hashPassword(password: string) {
    return "p_hash:" + password;
}

export async function verifyPassword(password: string, hash: string) {
    return hash === "p_hash:" + password;
}
