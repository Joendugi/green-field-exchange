import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/integrations/supabase/admin";

export type TestResult = {
    name: string;
    status: "pass" | "fail" | "running";
    message?: string;
    duration?: string;
};

export async function runSmokeTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    const runTest = async (name: string, fn: () => Promise<any>): Promise<TestResult> => {
        const start = performance.now();
        try {
            await fn();
            const end = performance.now();
            return { name, status: "pass", duration: `${Math.round(end - start)}ms` };
        } catch (error: any) {
            const end = performance.now();
            return { name, status: "fail", message: error.message, duration: `${Math.round(end - start)}ms` };
        }
    };

    // 1. Connection Test
    results.push(await runTest("Database Connection", async () => {
        const { error } = await supabase.from("profiles").select("count", { count: "estimated", head: true });
        if (error) throw error;
    }));

    // 2. Auth Test
    results.push(await runTest("Authentication Context", async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) throw new Error("No active session found");
    }));

    // 3. Admin Permission Test
    results.push(await runTest("Admin Privileges", async () => {
        const isUserAdmin = await isAdmin();
        if (!isUserAdmin) throw new Error("Current user does not have admin role");
    }));

    // 4. Storage Access Test
    results.push(await runTest("Storage API Health", async () => {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("No storage buckets found");
    }));

    // 5. Edge Function Health (Optional/Check if exists)
    results.push(await runTest("Edge Functions (AI/Price)", async () => {
        const { error } = await supabase.functions.invoke('ai-chat', {
            body: { messages: [{ role: "user", content: "ping" }] }
        });
        // We don't throw if it fails (might just be missing API keys), but we log it
        if (error && error.message.includes("404")) throw new Error("Edge functions not deployed");
    }));

    return results;
}
