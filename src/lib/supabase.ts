import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { brokeredPreviewStorage } from "@/integrations/supabase/previewAuthStorage";

/**
 * Robust environment variable lookup supporting Vite client variables and SSR/Node fallbacks.
 * Complies with strict TypeScript noPropertyAccessFromIndexSignature.
 */
function getEnv(key: string): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const envObj = import.meta.env as Record<string, string | undefined>;
    const val = envObj[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  if (typeof process !== "undefined" && process.env) {
    const envObj = process.env as Record<string, string | undefined>;
    const val = envObj[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return undefined;
}

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

/**
 * Factory to create a hardened Supabase client instance.
 * Configured with:
 * - flowType: 'pkce' (RFC 7636 Proof Key for Code Exchange to prevent token leakage in URL fragments)
 * - detectSessionInUrl: true
 * - autoRefreshToken: true
 * - persistSession: true
 * - storage: brokeredPreviewStorage() (supports Lovable preview iframes & localStorage in standalone)
 */
export function createSupabaseClient() {
  const SUPABASE_URL =
    getEnv("VITE_SUPABASE_URL") ||
    getEnv("SUPABASE_URL");

  const SUPABASE_KEY =
    getEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ||
    getEnv("VITE_SUPABASE_ANON_KEY") ||
    getEnv("SUPABASE_PUBLISHABLE_KEY") ||
    getEnv("SUPABASE_ANON_KEY");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const missing: string[] = [];
    if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL / SUPABASE_URL");
    if (!SUPABASE_KEY) {
      missing.push(
        "VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEY",
      );
    }
    const message = `[Supabase Security] Missing required configuration: ${missing.join(", ")}. Connect Supabase or configure environment variables.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      debug: typeof import.meta !== "undefined" && Boolean((import.meta.env as Record<string, unknown> | undefined)?.["DEV"]),
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

/**
 * Lazily initialized singleton proxy for Supabase client.
 * Avoids throwing at import/build time when environment variables are not yet injected.
 */
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, _supabase);
  },
});

/**
 * Systematically removes sensitive client-side PII and cached session artifacts
 * from localStorage and sessionStorage upon sign-out to prevent data leakage
 * on shared devices (Checklist Top 19 Rule 16).
 */
export function clearAppSessionData(): void {
  if (typeof window === "undefined") return;

  const sensitiveExactKeys = [
    "kiestudos_profile",
    "kiestudos_avatar",
    "kiestudos_target_exam_id",
    "kiestudos_target_exam_title",
    "kiestudos_target_exam_slug",
    "kiestudos_target_exam",
    "kiestudos_study_stats",
    "kiestudos_recent_answers",
    "kiestudos_auth_session",
    "kiestudos_remember_me",
    "kiestudos_simulado_guest_attempts",
    "kiestudos_edital_progress",
  ];

  try {
    // 1. Remove specific known PII keys
    for (const key of sensitiveExactKeys) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }

    // 2. Scan and remove any dynamically prefixed PII or Supabase session tokens
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("kiestudos_ai_summary_") ||
          (key.startsWith("sb-") && key.endsWith("-auth-token")))
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn("[Session Security] Error clearing sensitive session data:", err);
  }
}

/**
 * Validates the active session against the Supabase Auth server.
 * Checklist Top 19 Rule 5: Avoid trusting unverified local session cache alone.
 */
export async function validateActiveSession() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    console.error("[Auth Security] Session verification failure:", err);
    return null;
  }
}

/**
 * Secure sign out helper that terminates the remote session and
 * purges all client-side PII and cached session artifacts.
 */
export async function secureSignOut(scope: "global" | "local" | "others" = "local"): Promise<void> {
  try {
    await supabase.auth.signOut({ scope });
  } catch (err) {
    console.warn("[Auth Security] Error during remote sign out:", err);
  } finally {
    clearAppSessionData();
  }
}

// Re-exports
export default supabase;
export type * from "@/integrations/supabase/types";
export type { Database, Json } from "@/integrations/supabase/types";
export type { Session, User, AuthError } from "@supabase/supabase-js";
