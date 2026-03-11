import { supabase } from "./client";

export type VerificationRequestRow = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "needs_more_info";
  documents?: string[];
  admin_notes?: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields from functions
  user_full_name?: string;
  user_email?: string;
};

export type AdminAuditLogRow = {
  id: string;
  admin_id: string;
  action: string;
  target_id?: string;
  target_type: "user" | "product" | "post" | "settings" | "verification" | "order" | "review";
  details?: string;
  metadata?: any;
  timestamp: string;
};

export type AdminSettingsRow = {
  id: string;
  force_dark_mode: boolean;
  enable_beta_features: boolean;
  enable_ads_portal: boolean;
  enable_bulk_tools: boolean;
  updated_by: string;
  updated_at: string;
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

// Verification Requests
export async function getMyVerificationRequest(): Promise<VerificationRequestRow | null> {
  const { data, error } = await supabase.rpc("get_my_verification_request");

  if (error) throw error;
  return (data as VerificationRequestRow[])?.[0] ?? null;
}

export async function getAllVerificationRequests(status?: string): Promise<VerificationRequestRow[]> {
  const { data, error } = await supabase.rpc("get_all_verification_requests", {
    p_status: status ?? null,
  });

  if (error) throw error;
  return (data as VerificationRequestRow[]) ?? [];
}

export async function createVerificationRequest(documents?: string[]): Promise<string> {
  const { data, error } = await supabase.rpc("create_verification_request", {
    p_documents: documents ?? null,
  });

  if (error) throw error;
  return data as string;
}

export async function updateVerificationRequest(
  requestId: string,
  status: VerificationRequestRow["status"],
  adminNotes?: string
): Promise<void> {
  const { error } = await supabase.rpc("update_verification_request", {
    p_request_id: requestId,
    p_status: status,
    p_admin_notes: adminNotes ?? null,
  });

  if (error) throw error;
}

// Admin Audit Logs
export async function logAdminAction(
  action: string,
  targetType: AdminAuditLogRow["target_type"],
  targetId?: string,
  details?: string,
  metadata?: any
): Promise<void> {
  const { error } = await supabase.rpc("log_admin_action", {
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId ?? null,
    p_details: details ?? null,
    p_metadata: metadata ?? null,
  });

  if (error) throw error;
}

export async function getAdminAuditLogs(limit = 100): Promise<AdminAuditLogRow[]> {
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as AdminAuditLogRow[]) ?? [];
}

// Admin Settings
export async function getAdminSettings(): Promise<AdminSettingsRow | null> {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("*")
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return (data as AdminSettingsRow) ?? null;
}

export async function updateAdminSettings(settings: Partial<Omit<AdminSettingsRow, "id" | "updated_by" | "updated_at">>): Promise<AdminSettingsRow> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("admin_settings")
    .update({ ...settings, updated_by: userId })
    .select("*")
    .single();

  if (error) throw error;
  return data as AdminSettingsRow;
}

// Rate Limiting
export async function checkRateLimit(
  key: string,
  action: string,
  limitSeconds = 60,
  maxAttempts = 5
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_action: action,
    p_limit_seconds: limitSeconds,
    p_max_attempts: maxAttempts,
  });

  if (error) throw error;
  return (data as boolean) ?? false;
}

// Login Attempts (admin only)
export async function getLoginAttempts(limit = 100): Promise<any[]> {
  const { data, error } = await supabase
    .from("login_attempts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as any[]) ?? [];
}

// Helper to check if current user is admin
export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", await getCurrentUserId())
    .eq("role", "admin")
    .single();

  if (error && error.code !== 'PGRST116') return false;
  return (data as any)?.role === "admin";
}
