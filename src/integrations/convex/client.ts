import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

export const convex = new ConvexHttpClient(CONVEX_URL);
