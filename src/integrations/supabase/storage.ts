import { supabase } from "./client";

export async function uploadFile(bucket: string, file: File, path?: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return { publicUrl, filePath };
}

export function getOptimizedUrl(url: string, options: { width?: number, height?: number, quality?: number } = {}) {
    if (!url || !url.includes("supabase.co/storage/v1/object/public")) return url;
    
    // Use Supabase Image Transformation if available (requires Pro plan usually)
    // Format: .../render/image/public/bucket/path?width=200&height=200&quality=80
    const { width, height, quality = 80 } = options;
    const params = new URLSearchParams();
    if (width) params.append("width", width.toString());
    if (height) params.append("height", height.toString());
    params.append("quality", quality.toString());
    params.append("format", "webp");

    // Check if the URL already has params
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}${params.toString()}`;
}
