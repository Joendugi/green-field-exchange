import { supabase } from "@/integrations/supabase/client";

export async function checkSystemHealth() {
    try {
        const start = performance.now();
        const { error } = await supabase.from("profiles").select("count", { count: "estimated", head: true });
        const end = performance.now();
        
        if (error) throw error;
        
        return {
            status: "healthy",
            latency: `${Math.round(end - start)}ms`,
            timestamp: new Date().toISOString()
        };
    } catch (error: any) {
        console.error("System Health Check Failed:", error);
        return {
            status: "degraded",
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}
