/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminSettings from "../adminSettings.js";
import type * as advertisements from "../advertisements.js";
import type * as auth from "../auth.js";
import type * as follows from "../follows.js";
import type * as http from "../http.js";
import type * as loginAttempts from "../loginAttempts.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as posts from "../posts.js";
import type * as priceHistory from "../priceHistory.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as userRoles from "../userRoles.js";
import type * as userSettings from "../userSettings.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminSettings: typeof adminSettings;
  advertisements: typeof advertisements;
  auth: typeof auth;
  follows: typeof follows;
  http: typeof http;
  loginAttempts: typeof loginAttempts;
  messages: typeof messages;
  notifications: typeof notifications;
  orders: typeof orders;
  posts: typeof posts;
  priceHistory: typeof priceHistory;
  products: typeof products;
  profiles: typeof profiles;
  userRoles: typeof userRoles;
  userSettings: typeof userSettings;
  users: typeof users;
  verification: typeof verification;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
