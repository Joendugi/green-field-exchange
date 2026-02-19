import { action, mutation } from "./_generated/server";

export const testSetTimeout = mutation({
    args: {},
    handler: async () => {
        return await new Promise((resolve) => setTimeout(resolve, 100));
    },
});

export const testSetTimeoutAction = action({
    args: {},
    handler: async () => {
        console.log("Testing setTimeout in action...");
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log("Success!");
        return "OK";
    },
});
