import { supabase } from "./client";

export type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  verification_requested: boolean;
  onboarded: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
};

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
  return (data as ProfileRow | null) ?? null;
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
  return data as ProfileRow;
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
  "username" | "full_name" | "avatar_url" | "bio" | "location" | "website"
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
  return data as ProfileRow;
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
