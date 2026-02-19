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
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as check_user from "../check_user.js";
import type * as debug from "../debug.js";
import type * as emailService from "../emailService.js";
import type * as fileValidation from "../fileValidation.js";
import type * as follows from "../follows.js";
import type * as grant_temp from "../grant_temp.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as loginAttempts from "../loginAttempts.js";
import type * as messages from "../messages.js";
import type * as metaAds from "../metaAds.js";
import type * as metaAds_backup from "../metaAds_backup.js";
import type * as metaAds_fixed from "../metaAds_fixed.js";
import type * as mutations from "../mutations.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as password from "../password.js";
import type * as passwordReset from "../passwordReset.js";
import type * as posts from "../posts.js";
import type * as priceHistory from "../priceHistory.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as rateLimit from "../rateLimit.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as setup_admin from "../setup_admin.js";
import type * as simulateScale from "../simulateScale.js";
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
  ai: typeof ai;
  auth: typeof auth;
  check_user: typeof check_user;
  debug: typeof debug;
  emailService: typeof emailService;
  fileValidation: typeof fileValidation;
  follows: typeof follows;
  grant_temp: typeof grant_temp;
  helpers: typeof helpers;
  http: typeof http;
  loginAttempts: typeof loginAttempts;
  messages: typeof messages;
  metaAds: typeof metaAds;
  metaAds_backup: typeof metaAds_backup;
  metaAds_fixed: typeof metaAds_fixed;
  mutations: typeof mutations;
  notifications: typeof notifications;
  orders: typeof orders;
  password: typeof password;
  passwordReset: typeof passwordReset;
  posts: typeof posts;
  priceHistory: typeof priceHistory;
  products: typeof products;
  profiles: typeof profiles;
  rateLimit: typeof rateLimit;
  rateLimiting: typeof rateLimiting;
  setup_admin: typeof setup_admin;
  simulateScale: typeof simulateScale;
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
