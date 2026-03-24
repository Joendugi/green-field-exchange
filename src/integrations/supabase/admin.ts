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
  target_type: "user" | "product" | "post" | "settings" | "verification" | "order" | "review" | "moderation" | "system";
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
  let query = supabase
    .from("verification_requests")
    .select("*, profiles!user_id(full_name, username, avatar_url, location, verified)")
    .order("created_at", { ascending: false });
    
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return (data as any[]) ?? [];
}

export async function createVerificationRequest(documents?: string[]): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase.from("verification_requests").insert({
    user_id: userId,
    documents: documents ?? null,
    status: "pending"
  }).select("id").single();

  if (error) throw error;
  return data.id as string;
}

export async function updateVerificationRequest(
  requestId: string,
  userId: string,
  status: VerificationRequestRow["status"],
  adminNotes?: string
): Promise<void> {
  const adminId = await getCurrentUserId();
  
  const { error } = await supabase.from("verification_requests").update({
    status,
    admin_notes: adminNotes ?? null,
    admin_id: adminId,
    updated_at: new Date().toISOString()
  }).eq("id", requestId);

  if (error) throw error;
  
  // also update user profile verficiation status if approved
  if (status === "approved") {
      await supabase.from("profiles").update({ verified: true, verification_requested: false }).eq("id", userId);
  } else if (status === "rejected") {
      await supabase.from("profiles").update({ verification_requested: false }).eq("id", userId);
  }
}


// Admin Audit Logs
export async function logAdminAction(
  action: string,
  targetType: AdminAuditLogRow["target_type"],
  targetId?: string,
  details?: string,
  metadata?: any
): Promise<void> {
  const adminId = await getCurrentUserId();
  if (!adminId) return;

  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    details: details ?? null,
    metadata: metadata ?? null,
  });

  if (error) console.error("audit log error", error);
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

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", await getCurrentUserId())
    .eq("role", "admin");

  if (error || !data || data.length === 0) return false;
  return true;
}

// User Management (admin only)
export async function listUsers(): Promise<any[]> {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");

    // Fetch profiles and user_roles separately to avoid FK join ambiguity
    const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
    if (profError) throw profError;

    const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

    const roleMap = (roles || []).reduce((acc: Record<string, string>, r: any) => {
        acc[r.user_id] = r.role;
        return acc;
    }, {});

    return (profiles || []).map((p: any) => ({ ...p, user_roles: [{ role: roleMap[p.user_id] ?? null }] }));
}

export async function updateRole(userId: string, role: string): Promise<void> {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

    if (error) throw error;
    await logAdminAction("update_role", "user", userId, `Updated role to ${role}`);
}

export async function banUser(userId: string, ban: boolean, reason?: string): Promise<void> {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("profiles")
        .update({ is_banned: ban, ban_reason: ban ? (reason || null) : null })
        .eq("id", userId);

    if (error) throw error;
    await logAdminAction(ban ? "ban_user" : "unban_user", "user", userId, reason);
}

export async function getStats() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");

    const [usersResult, productsResult, ordersResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_price")
    ]);

    const revenue = (ordersResult.data || []).reduce((sum, order) => sum + (order.total_price || 0), 0);
    
    return {
        users: usersResult.count || 0,
        products: productsResult.count || 0,
        orders: ordersResult.data?.length || 0,
        revenue
    };
}

export async function listPosts() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    // Use separate fetch to avoid PostgREST join ambiguity on user_id column
    const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) {
        console.error("Error in admin listPosts:", error);
        throw error;
    }
    if (!posts || posts.length === 0) return [];

    // Enrich with profile data
    const userIds = [...new Set(posts.map((p: any) => p.user_id))];
    const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", userIds);
    const profileMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
        acc[p.user_id] = p;
        return acc;
    }, {});
    return posts.map((p: any) => ({ ...p, profiles: profileMap[p.user_id] ?? null }));
}

export async function listProducts() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    // Fetch products and join profiles separately to avoid FK join ambiguity
    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) {
        console.error("Error in admin listProducts:", error);
        throw error;
    }
    if (!products || products.length === 0) return [];

    const farmerIds = [...new Set(products.map((p: any) => p.farmer_id))];
    const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username")
        .in("user_id", farmerIds);
    const profileMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
        acc[p.user_id] = p;
        return acc;
    }, {});
    return products.map((p: any) => ({ ...p, profiles: profileMap[p.farmer_id] ?? null }));
}

export async function listEmailLogs() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    // email_logs uses 'timestamp' not 'created_at' as its sort column
    const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("timestamp", { ascending: false });
    if (error && (error.code === '42P01' || error.code === 'PGRST116')) return []; // table doesn't exist
    if (error) throw error;
    return data || [];
}

export async function listAdvertisements() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    // advertisements table is optional — return empty if not found
    const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("created_at", { ascending: false });
    if (error && (error.code === '42P01' || error.code === '42501' || error.message?.includes('404'))) return [];
    if (error) throw error;
    return data || [];
}

export async function getRecentActivity() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    
    // Simplistic recent activity from audit logs
    const logs = await getAdminAuditLogs(10);
    return logs.map(l => ({
        id: l.id,
        icon: "🛡️",
        label: l.action,
        time: l.timestamp,
        type: l.target_type
    }));
}

export async function getGrowthStats() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    
    // Get user growth by month
    const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("created_at");
        
    if (pError) throw pError;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    
    const statsMap: Record<string, { users: number, revenue: number }> = {};
    
    profiles.forEach(p => {
        const d = new Date(p.created_at);
        if (d.getFullYear() === currentYear) {
            const m = months[d.getMonth()];
            if (!statsMap[m]) statsMap[m] = { users: 0, revenue: 0 };
            statsMap[m].users++;
        }
    });

    // Get revenue by month
    const { data: orders, error: oError } = await supabase
        .from("orders")
        .select("total_price, created_at")
        .eq("status", "completed");
        
    if (!oError && orders) {
        orders.forEach(o => {
            const d = new Date(o.created_at);
            if (d.getFullYear() === currentYear) {
                const m = months[d.getMonth()];
                if (!statsMap[m]) statsMap[m] = { users: 0, revenue: 0 };
                statsMap[m].revenue += Number(o.total_price || 0);
            }
        });
    }

    return Object.entries(statsMap)
        .map(([label, data]) => ({ label, ...data }))
        .sort((a,b) => months.indexOf(a.label) - months.indexOf(b.label));
}

export async function broadcastNotification(opts: { title: string, message: string, sendEmail?: boolean }) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    
    // Create broadcast record (triggers in-app notifications)
    const { data: broadcast, error: bError } = await supabase
        .from("broadcast_messages")
        .insert({
            title: opts.title,
            message: opts.message,
            sent_email: opts.sendEmail || false,
            admin_id: await getCurrentUserId()
        })
        .select()
        .single();

    if (bError) throw bError;

    // Send emails if requested
    if (opts.sendEmail) {
        const { data: users, error: uError } = await supabase.from("profiles").select("email:id(email)"); // Need join or auth list
        // Supabase has strict RLS on auth.users, usually you'd maintain an email column in profiles or use a service role in an edge function

        // Calling an Edge Function that has service role access to send to ALL users
        await supabase.functions.invoke('send-email', {
            body: {
                to: "ALL_USERS", // Specialized logic in edge function
                subject: opts.title,
                html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #2F855A;">Wakulima News: ${opts.title}</h2>
                        <p>${opts.message}</p>
                        <hr style="border: 0; border-top: 1px solid #EEE;" />
                        <p style="font-size: 12px; color: #777;">You are receiving this as a member of Wakulima Exchange.</p>
                      </div>`
            }
        });
    }

    await logAdminAction("broadcast", "settings", undefined, opts.title);
}

export async function hidePost(args: { postId: string, hide: boolean }) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    const { error } = await supabase.from("posts").update({ hidden: args.hide }).eq("id", args.postId);
    if (error) throw error;
    await logAdminAction(args.hide ? "hide_post" : "unhide_post", "post", args.postId);
}

export async function hideProduct(args: { productId: string, hide: boolean }) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    const { error } = await supabase.from("products").update({ hidden: args.hide }).eq("id", args.productId);
    if (error) throw error;
    await logAdminAction(args.hide ? "hide_product" : "unhide_product", "product", args.productId);
}

export async function toggleFeatured(args: { productId: string, featured: boolean }) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    const { error } = await supabase.from("products").update({ featured: args.featured }).eq("id", args.productId);
    if (error) throw error;
    await logAdminAction("toggle_featured", "product", args.productId, `Featured: ${args.featured}`);
}

export async function togglePostFeatured(args: { postId: string, isFeatured: boolean }) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    const { error } = await supabase.from("posts").update({ isFeatured: args.isFeatured } as any).eq("id", args.postId);
    if (error) throw error;
    await logAdminAction("toggle_post_featured", "post", args.postId, `Featured: ${args.isFeatured}`);
}

export async function bulkTogglePostFeatured(args: { postIds: string[], isFeatured: boolean }) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    const { error } = await supabase.from("posts").update({ isFeatured: args.isFeatured } as any).in("id", args.postIds);
    if (error) throw error;
    await logAdminAction("bulk_toggle_post_featured", "post", undefined, `Featured ${args.postIds.length} posts`);
}

// Escrow Management
export async function listDisputedOrders() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            product:products(*),
            buyer:profiles!buyer_id(id, full_name, avatar_url),
            farmer:profiles!farmer_id(id, full_name, avatar_url)
        `)
        .eq("status", "disputed")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function resolveDispute(args: { orderId: string, resolution: "refund" | "release" }) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");

    const status = args.resolution === "refund" ? "cancelled" : "completed";
    const escrow_status = args.resolution === "refund" ? "refunded" : "released";

    const { error } = await supabase
        .from("orders")
        .update({ status, escrow_status })
        .eq("id", args.orderId);

    if (error) throw error;

    await logAdminAction("resolve_dispute", "order", args.orderId, `Resolved as ${args.resolution}`);
}

// AI Content Moderation Stub
export async function moderateContent() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    
    try {
        const { data, error } = await supabase.functions.invoke('moderate-content');
        if (error) throw error;
        
        await logAdminAction("moderate_scan", "moderation", undefined, `Flagged: ${data.flagged?.length || 0}`);
        return { flagged: data.flagged || [] };
    } catch (error) {
        console.error("AI Moderation failed", error);
        return { flagged: [] }; // Fallback to avoid breaking UI
    }
}
// Analytics
export async function getGlobalHeatmap() {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) throw new Error("Unauthorized");
    
    // Aggregate by profiles.location
    const { data: products } = await supabase.from("products").select("location, price");
    const { data: orders } = await supabase.from("orders").select("total_price, products!inner(location)").eq("status", "completed");
    
    const heatmap: Record<string, { location: string, products: number, orders: number, revenue: number }> = {};
    
    (products || []).forEach(p => {
        const loc = p.location || "Unknown";
        if (!heatmap[loc]) heatmap[loc] = { location: loc, products: 0, orders: 0, revenue: 0 };
        heatmap[loc].products++;
    });
    
    (orders || []).forEach((o: any) => {
        const loc = o.products?.location || "Unknown";
        if (!heatmap[loc]) heatmap[loc] = { location: loc, products: 0, orders: 0, revenue: 0 };
        heatmap[loc].orders++;
        heatmap[loc].revenue += Number(o.total_price || 0);
    });
    
    return Object.values(heatmap).sort((a,b) => b.revenue - a.revenue);
}
