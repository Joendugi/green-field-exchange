/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as advertisements from "../advertisements.js";
import type * as loginAttempts from "../loginAttempts.js";
import type * as posts from "../posts.js";
import type * as priceHistory from "../priceHistory.js";
import type * as profiles from "../profiles.js";
import type * as userRoles from "../userRoles.js";
import type * as userSettings from "../userSettings.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  advertisements: typeof advertisements;
  loginAttempts: typeof loginAttempts;
  posts: typeof posts;
  priceHistory: typeof priceHistory;
  profiles: typeof profiles;
  userRoles: typeof userRoles;
  userSettings: typeof userSettings;
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
