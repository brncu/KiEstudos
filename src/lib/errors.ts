/**
 * Centralized Error Sanitization and CWE-209 (Information Disclosure) Mitigation
 * Prevents internal database details, table names, RLS policy violations,
 * and user enumeration from leaking to the frontend UI or toasts.
 */

const IS_DEV =
  (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production") ||
  (typeof import.meta !== "undefined" &&
    Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV));

/**
 * Universal notice for password reset requests to completely prevent user enumeration.
 * Regardless of whether an email exists in the database or not, the same message is presented.
 */
export const PASSWORD_RESET_GENERIC_NOTICE =
  "Se o e-mail informado estiver cadastrado em nosso sistema, as instruções para redefinição de senha serão enviadas em instantes.";

/**
 * Sanitizes any generic or database error message before displaying to end users.
 * Strips raw PostgreSQL errors, RLS policy violations, table names, and syntax errors.
 */
export function sanitizeErrorMessage(
  err: unknown,
  fallback = "Ocorreu um erro ao processar a operação. Tente novamente mais tarde.",
): string {
  if (!err) return fallback;

  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);

  // Log full internal error only in non-production environments
  if (IS_DEV) {
    console.error("[Backend Error Detail - Dev Only]:", err);
  }

  const lower = rawMessage.toLowerCase();

  // Rate Limiting
  if (
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("over_request_rate_limit")
  ) {
    return "Muitas tentativas em sequência. Por segurança, aguarde alguns minutos antes de tentar novamente.";
  }

  // Network / Connection
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("timeout") ||
    lower.includes("abort") ||
    lower.includes("connection refused")
  ) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
  }

  // Permission / Authorization
  if (
    lower.includes("row-level security") ||
    lower.includes("policy") ||
    lower.includes("permission denied") ||
    lower.includes("unauthorized") ||
    lower.includes("42501")
  ) {
    return "Permissão insuficiente ou sessão expirada. Tente novamente ou reconecte sua conta.";
  }

  // Check if raw message contains database or internal technical terms
  const technicalPatterns = [
    "postgres",
    "relation",
    "foreign key",
    "unique constraint",
    "violates",
    "duplicate key",
    "syntax error",
    "column",
    "schema",
    "supabase",
    "table",
    "jwt",
    "bearer",
    "pgrst",
    "postgrest",
    "function",
    "null value in column",
  ];

  const hasTechnicalTerms = technicalPatterns.some((pattern) => lower.includes(pattern));

  if (hasTechnicalTerms) {
    return fallback;
  }

  // If the message is short, clean and user-oriented (no tech tokens), return it; otherwise fallback
  if (rawMessage.length > 0 && rawMessage.length <= 150 && !hasTechnicalTerms) {
    return rawMessage;
  }

  return fallback;
}

/**
 * Sanitizes Supabase Auth error responses into user-friendly localized text.
 */
export function toUserFriendlyAuthError(
  err: unknown,
  defaultMessage = "Não foi possível concluir a autenticação. Verifique seus dados e tente novamente.",
): string {
  if (!err) return defaultMessage;

  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);

  if (IS_DEV) {
    console.error("[Auth Error Detail - Dev Only]:", err);
  }

  const lower = rawMessage.toLowerCase();

  // Rate Limiting (Brute Force Protection)
  if (
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("over_request_rate_limit") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "Muitas tentativas em sequência. Por segurança, aguarde alguns minutos antes de tentar novamente.";
  }

  // Network / Offline
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("timeout") ||
    lower.includes("abort") ||
    lower.includes("connection refused")
  ) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
  }

  // Invalid Credentials
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_credentials") ||
    lower.includes("invalid grant") ||
    lower.includes("wrong password")
  ) {
    return "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.";
  }

  // User Already Exists
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("user_already_exists")
  ) {
    return "Não foi possível criar a conta com os dados informados. Verifique e tente novamente.";
  }

  // Email Not Confirmed
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return "E-mail ainda não confirmado. Verifique sua caixa de entrada e pasta de confirmação.";
  }

  // Password Requirements
  if (lower.includes("password should be") || lower.includes("weak_password")) {
    return "A senha informada não atende aos critérios mínimos de segurança.";
  }

  return defaultMessage;
}

/**
 * Handles password recovery errors while strictly avoiding user enumeration.
 * Rate limit and network errors are reported, while any user-existence asymmetry is shielded.
 */
export function sanitizePasswordResetResult(err: unknown): {
  userMessage: string;
  kind: "ok" | "error";
} {
  if (!err) {
    return {
      userMessage: PASSWORD_RESET_GENERIC_NOTICE,
      kind: "ok",
    };
  }

  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);

  const lower = rawMessage.toLowerCase();

  // Rate Limiting must still inform the user
  if (
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("over_request_rate_limit") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return {
      userMessage:
        "Muitas solicitações em sequência. Aguarde alguns minutos antes de solicitar novamente.",
      kind: "error",
    };
  }

  // Network failure
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("timeout")
  ) {
    return {
      userMessage: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
      kind: "error",
    };
  }

  // Anti-enumeration: Return the same generic success message even if the email doesn't exist
  return {
    userMessage: PASSWORD_RESET_GENERIC_NOTICE,
    kind: "ok",
  };
}

// Aliases for flexibility and backwards compatibility
export const sanitizeDatabaseError = sanitizeErrorMessage;
export const sanitizeAuthError = toUserFriendlyAuthError;
