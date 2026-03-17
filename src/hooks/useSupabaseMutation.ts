import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * A wrapper around tanstack-query for simplified Supabase mutations.
 */
export function useSupabaseMutation<TVariables, TData>(
    mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: any }>,
    options?: Omit<UseMutationOptions<TData | null, any, TVariables>, 'mutationFn'>
) {
    return useMutation<TData | null, any, TVariables>({
        mutationFn: async (variables: TVariables) => {
            const { data, error } = await mutationFn(variables);
            if (error) throw error;
            return data;
        },
        ...options as any
    });
}
