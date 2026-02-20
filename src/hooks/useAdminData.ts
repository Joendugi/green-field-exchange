/**
 * useAdminData
 *
 * Centralizes all admin-specific Convex queries.
 * Import this hook in any admin component instead of calling useQuery individually.
 *
 * Usage:
 *   const { users, auditLogs, isLoading } = useAdminData();
 */
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAdminData() {
    const stats = useQuery(api.admin.getStats);
    const users = useQuery(api.admin.listUsers);
    const verificationRequests = useQuery(api.admin.listVerificationRequests);
    const posts = useQuery(api.admin.listPosts);
    const products = useQuery(api.admin.listProducts);
    const advertisements = useQuery(api.advertisements.list);
    const adminSettingsData = useQuery(api.adminSettings.get);
    const auditLogs = useQuery(api.admin.listAuditLogs);

    const isLoading =
        stats === undefined ||
        users === undefined ||
        verificationRequests === undefined ||
        posts === undefined ||
        products === undefined ||
        advertisements === undefined ||
        adminSettingsData === undefined;

    return {
        // Data (with safe fallbacks once loaded)
        stats: stats ?? { users: 0, products: 0, orders: 0, revenue: 0 },
        users: users ?? [],
        verificationRequests: verificationRequests ?? [],
        posts: posts ?? [],
        products: products ?? [],
        advertisements: advertisements ?? [],
        adminSettingsData: adminSettingsData ?? null,
        auditLogs: auditLogs ?? [],
        // Loading state
        isLoading,
    };
}
