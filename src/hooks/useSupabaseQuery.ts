import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * A wrapper around tanstack-query for simplified Supabase fetching.
 * Mimics the feel of Convex's useQuery but for Supabase.
 */
export function useSupabaseQuery<T>(
    key: string[],
    queryFn: () => Promise<any>,
    options?: Omit<UseQueryOptions<T | null, any>, 'queryKey' | 'queryFn'>
) {
    return useQuery<T | null, any>({
        queryKey: key,
        queryFn: async () => {
            const result = await queryFn();
            if (result && typeof result === 'object' && 'error' in result && 'data' in result) {
                if (result.error) throw result.error;
                return result.data;
            }
            return result;
        },
        ...options as any
    });
}
