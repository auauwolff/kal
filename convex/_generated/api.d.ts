/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cheers from "../cheers.js";
import type * as data_curatedFoods from "../data/curatedFoods.js";
import type * as data_primaryFoods from "../data/primaryFoods.js";
import type * as data_slugFoods from "../data/slugFoods.js";
import type * as exercise_logs from "../exercise_logs.js";
import type * as foods from "../foods.js";
import type * as friendships from "../friendships.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_dateAEST from "../lib/dateAEST.js";
import type * as lib_dayTotals from "../lib/dayTotals.js";
import type * as lib_rewards from "../lib/rewards.js";
import type * as lib_social from "../lib/social.js";
import type * as lib_streaks from "../lib/streaks.js";
import type * as meal_logs from "../meal_logs.js";
import type * as meal_templates from "../meal_templates.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";
import type * as validators from "../validators.js";
import type * as weights from "../weights.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cheers: typeof cheers;
  "data/curatedFoods": typeof data_curatedFoods;
  "data/primaryFoods": typeof data_primaryFoods;
  "data/slugFoods": typeof data_slugFoods;
  exercise_logs: typeof exercise_logs;
  foods: typeof foods;
  friendships: typeof friendships;
  "lib/auth": typeof lib_auth;
  "lib/dateAEST": typeof lib_dateAEST;
  "lib/dayTotals": typeof lib_dayTotals;
  "lib/rewards": typeof lib_rewards;
  "lib/social": typeof lib_social;
  "lib/streaks": typeof lib_streaks;
  meal_logs: typeof meal_logs;
  meal_templates: typeof meal_templates;
  stats: typeof stats;
  users: typeof users;
  validators: typeof validators;
  weights: typeof weights;
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
