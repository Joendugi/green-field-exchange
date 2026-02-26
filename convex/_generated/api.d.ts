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
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as emailService from "../emailService.js";
import type * as escrow from "../escrow.js";
import type * as expiry from "../expiry.js";
import type * as fileValidation from "../fileValidation.js";
import type * as files from "../files.js";
import type * as follows from "../follows.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as loginAttempts from "../loginAttempts.js";
import type * as maintenance from "../maintenance.js";
import type * as matching from "../matching.js";
import type * as messages from "../messages.js";
import type * as metaAds from "../metaAds.js";
import type * as mutations from "../mutations.js";
import type * as notifications from "../notifications.js";
import type * as offers from "../offers.js";
import type * as orders from "../orders.js";
import type * as password from "../password.js";
import type * as passwordReset from "../passwordReset.js";
import type * as posts from "../posts.js";
import type * as priceHistory from "../priceHistory.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as reviews from "../reviews.js";
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
  analytics: typeof analytics;
  auth: typeof auth;
  crons: typeof crons;
  emailService: typeof emailService;
  escrow: typeof escrow;
  expiry: typeof expiry;
  fileValidation: typeof fileValidation;
  files: typeof files;
  follows: typeof follows;
  helpers: typeof helpers;
  http: typeof http;
  loginAttempts: typeof loginAttempts;
  maintenance: typeof maintenance;
  matching: typeof matching;
  messages: typeof messages;
  metaAds: typeof metaAds;
  mutations: typeof mutations;
  notifications: typeof notifications;
  offers: typeof offers;
  orders: typeof orders;
  password: typeof password;
  passwordReset: typeof passwordReset;
  posts: typeof posts;
  priceHistory: typeof priceHistory;
  products: typeof products;
  profiles: typeof profiles;
  rateLimiting: typeof rateLimiting;
  reviews: typeof reviews;
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
