import { supabase } from "./client";

export type ProfileRow = {
  id: string;
  /** Alias for `id` – used by components that expect a Convex-style userId */
  userId: string;
  /** Alias for `id` – used by components that expect a Convex-style _id */
  _id: string;
  username: string;
  full_name: string | null;
  /** Alias for `full_name` */
  name: string | null;
  avatar_url: string | null;
  /** Alias for `avatar_url` */
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  verification_requested: boolean;
  onboarded: boolean;
  /** Alias for `onboarded` */
  onboarding_completed: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
};

/** Adds computed alias fields to a raw Supabase profiles row. */
function enrichProfile(raw: Record<string, any>): ProfileRow {
  return {
    ...raw,
    userId: raw.id,
    _id: raw.id,
    name: raw.full_name ?? null,
    image: raw.avatar_url ?? null,
    onboarding_completed: Boolean(raw.onboarded),
  } as ProfileRow;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function getMyProfile(): Promise<ProfileRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? enrichProfile(data) : null;
}

export async function upsertMyProfile(input: {
  username: string;
  full_name?: string;
}): Promise<ProfileRow> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const payload = {
    id: userId,
    username: input.username,
    full_name: input.full_name ?? null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return enrichProfile(data);
}

export async function ensureMyRole(role: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

  if (error) throw error;
}

export async function updateMyProfile(changes: Partial<Pick<
  ProfileRow,
  "username" | "full_name" | "avatar_url" | "bio" | "location" | "website" | "onboarded"
>>): Promise<ProfileRow> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...changes })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return enrichProfile(data);
}

export async function requestMyVerification(): Promise<ProfileRow> {
  return await updateMyProfile({ verification_requested: true } as any);
}

export async function getMyRole(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  // Prefer admin if present.
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) throw error;

  const roles = (data ?? []).map((r: any) => r.role as string);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("farmer")) return "farmer";
  if (roles.length > 0) return roles[0];
  return null;
}

export async function getUserProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? enrichProfile(data) : null;
}

export async function getRole(userId: string): Promise<{role: string}> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return { role: "farmer" }; // Default fallback
  return data as { role: string };
}
