import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * File upload validation utilities
 * Validates file type, size, and content before allowing uploads
 */

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
];

const ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export const validateFileUpload = mutation({
    args: {
        fileType: v.string(),
        fileSize: v.number(),
        uploadType: v.string(), // "avatar", "product", "post_image", "post_video"
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Validate file type based on upload type
        let allowedTypes: string[];
        let maxSize: number;

        switch (args.uploadType) {
            case "avatar":
                allowedTypes = ALLOWED_IMAGE_TYPES;
                maxSize = MAX_AVATAR_SIZE;
                break;
            case "product":
            case "post_image":
                allowedTypes = ALLOWED_IMAGE_TYPES;
                maxSize = MAX_IMAGE_SIZE;
                break;
            case "post_video":
                allowedTypes = ALLOWED_VIDEO_TYPES;
                maxSize = MAX_VIDEO_SIZE;
                break;
            default:
                throw new Error("Invalid upload type");
        }

        // Validate file type
        if (!allowedTypes.includes(args.fileType.toLowerCase())) {
            throw new Error(
                `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
            );
        }

        // Validate file size
        if (args.fileSize > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
        }

        if (args.fileSize <= 0) {
            throw new Error("Invalid file size");
        }

        // Generate upload URL after validation
        const uploadUrl = await ctx.storage.generateUploadUrl();

        return {
            uploadUrl,
            maxSize,
            allowedTypes,
        };
    },
});

// Helper to validate uploaded file after storage
export const verifyUploadedFile = mutation({
    args: {
        storageId: v.id("_storage"),
        expectedType: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Get file metadata from storage
        const fileMetadata = await ctx.storage.getMetadata(args.storageId);

        if (!fileMetadata) {
            throw new Error("File not found");
        }

        // Verify content type matches expected
        if (args.expectedType === "image") {
            if (!fileMetadata.contentType?.startsWith("image/")) {
                await ctx.storage.delete(args.storageId);
                throw new Error("Invalid image file");
            }
        } else if (args.expectedType === "video") {
            if (!fileMetadata.contentType?.startsWith("video/")) {
                await ctx.storage.delete(args.storageId);
                throw new Error("Invalid video file");
            }
        }

        return {
            verified: true,
            contentType: fileMetadata.contentType,
            size: fileMetadata.size,
        };
    },
});
