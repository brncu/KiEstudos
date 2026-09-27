import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Check,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { signInSchema, signUpSchema, forgotPasswordSchema } from "@/lib/validations/auth";
import { toUserFriendlyAuthError, sanitizePasswordResetResult } from "@/lib/errors";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

const GlassInputWrapper = ({
  children,
  icon: Icon,
  hasError = false,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  hasError?: boolean;
}) => (
  <div
    className={cn(
      "relative rounded-3xl border bg-[#0a1122] transition-colors flex items-center shadow-inner",
      hasError
        ? "border-red-500/50 focus-within:border-red-500"
        : "border-white/5 focus-within:border-emerald-500/50",
    )}
  >
    {Icon && (
      <div className={cn("pl-4 pr-1", hasError ? "text-red-400" : "text-slate-500")}>
        <Icon size={16} />
      </div>
    )}
    {children}
  </div>
);

interface AuthValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [successFading, setSuccessFading] = useState(false);
  const [message, setMessage] = useState<{ text: string; kind: "error" | "ok" } | null>(null);

  // Form values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<AuthValidationErrors>({});
  const [rememberMe, setRememberMe] = useState(false);

  // Synchronous lock to prevent concurrent submissions before state re-renders
  const submittingRef = useRef(false);

  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session && !successFading) {
      navigate({ to: "/" });
    }
  }, [session, loading, navigate, successFading]);

  const switchMode = (newMode: "signin" | "signup" | "forgot") => {
    if (busy) return;
    setMode(newMode);
    setMessage(null);
    setValidationErrors({});
    setPassword("");
    setConfirmPassword("");
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || submittingRef.current) return;

    setMessage(null);
    setValidationErrors({});

    // 1. Strict Zod Client-Side Validation - Blocks invalid inputs before any backend call
    if (mode === "signin") {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) {
        const fieldErrors: AuthValidationErrors = {};
        for (const issue of parsed.error.issues) {
          const fieldName = issue.path[0] as keyof AuthValidationErrors;
          if (fieldName && !fieldErrors[fieldName]) {
            fieldErrors[fieldName] = issue.message;
          }
        }
        setValidationErrors(fieldErrors);
        setMessage({
          text: parsed.error.issues[0]?.message || "Verifique os dados informados.",
          kind: "error",
        });
        return;
      }
    } else if (mode === "signup") {
      const parsed = signUpSchema.safeParse({
        fullName,
        email,
        password,
        confirmPassword,
      });
      if (!parsed.success) {
        const fieldErrors: AuthValidationErrors = {};
        for (const issue of parsed.error.issues) {
          const fieldName = issue.path[0] as keyof AuthValidationErrors;
          if (fieldName && !fieldErrors[fieldName]) {
            fieldErrors[fieldName] = issue.message;
          }
        }
        setValidationErrors(fieldErrors);
        setMessage({
          text: parsed.error.issues[0]?.message || "Verifique os dados informados.",
          kind: "error",
        });
        return;
      }
    } else if (mode === "forgot") {
      const parsed = forgotPasswordSchema.safeParse({ email });
      if (!parsed.success) {
        const fieldErrors: AuthValidationErrors = {};
        for (const issue of parsed.error.issues) {
          const fieldName = issue.path[0] as keyof AuthValidationErrors;
          if (fieldName && !fieldErrors[fieldName]) {
            fieldErrors[fieldName] = issue.message;
          }
        }
        setValidationErrors(fieldErrors);
        setMessage({
          text: parsed.error.issues[0]?.message || "Insira um e-mail válido.",
          kind: "error",
        });
        return;
      }
    }

    // 2. Active Double-Submission Prevention: Acquire synchronous lock & reactive busy state
    submittingRef.current = true;
    setBusy(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth`,
        });
        const sanitized = sanitizePasswordResetResult(error);
        setMessage({ text: sanitized.userMessage, kind: sanitized.kind });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;

        if (data?.session) {
          setSuccessFading(true);
          setTimeout(() => {
            navigate({ to: "/" });
          }, 1200);
        } else {
          setMessage({
            text: "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.",
            kind: "ok",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        setSuccessFading(true);
        setTimeout(() => {
          navigate({ to: "/" });
        }, 1200);
      }
    } catch (err: unknown) {
      const safeMsg = toUserFriendlyAuthError(err);
      setMessage({ text: safeMsg, kind: "error" });
    } finally {
      submittingRef.current = false;
      if (!successFading) {
        setBusy(false);
      }
    }
  }

  async function onGoogleSignIn() {
    if (busy || submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
    } catch (err) {
      submittingRef.current = false;
      setBusy(false);
      setMessage({
        text: toUserFriendlyAuthError(err, "Não foi possível conectar com o Google."),
        kind: "error",
      });
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw] bg-[#020813] text-slate-50 relative overflow-hidden">
      {/* Background glow effects for the dark theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />

      {/* Left column: auth form */}
      <motion.section
        animate={successFading ? { opacity: 0, x: -50 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="flex-1 flex justify-center p-6 md:p-8 z-10 relative overflow-y-auto"
      >
        <div className="w-full max-w-[380px] my-auto py-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-start gap-3">
            <div className="animate-fade-up w-full flex justify-start mb-1">
              <img
                alt="KiEstudos Logo"
                className="w-auto object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] filter brightness-110 h-16 sm:h-20 max-h-24 mix-blend-lighten opacity-90"
                style={{ height: "76px", maxHeight: "96px", width: "auto", objectFit: "contain" }}
                src="/logo-kiestudos.jpg"
              />
            </div>

            <div className="space-y-2 w-full">
              <h1 className="animate-fade-up delay-100 text-[2.25rem] sm:text-[2.5rem] font-bold tracking-tight text-white leading-none">
                {mode === "signin"
                  ? "Portal do Aluno"
                  : mode === "signup"
                    ? "Criar Conta"
                    : "Recuperar Senha"}
              </h1>
              <p className="animate-fade-up delay-200 text-slate-400 text-sm leading-relaxed font-medium pr-4">
                {mode === "signin"
                  ? "A plataforma completa para acelerar seu aprendizado. Domine qualquer matéria com métodos inteligentes e alta retenção."
                  : mode === "signup"
                    ? "Junte-se ao KiEstudos e monte seu ecossistema de aprovação com IA e cronogramas inteligentes."
                    : "Digite seu e-mail cadastrado e nós enviaremos um link para você redefinir sua senha."}
              </p>
            </div>
          </div>

          {message && (
            <div
              className={cn(
                "animate-fade-up delay-200 p-4 rounded-xl text-xs flex items-center gap-2 font-medium border",
                message.kind === "error"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              )}
            >
              {message.text}
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            {/* Full Name field in signup mode */}
            {mode === "signup" && (
              <div className="animate-fade-up delay-250 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 ml-1 tracking-widest uppercase">
                  Nome Completo
                </label>
                <GlassInputWrapper icon={UserIcon} hasError={Boolean(validationErrors.fullName)}>
                  <input
                    name="fullName"
                    type="text"
                    disabled={busy}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (validationErrors.fullName) {
                        setValidationErrors((prev) => ({ ...prev, fullName: "" }));
                      }
                    }}
                    placeholder="Seu nome completo"
                    className="w-full bg-transparent text-sm py-3.5 pr-4 focus:outline-none text-white placeholder:text-slate-600 font-medium disabled:opacity-60"
                  />
                </GlassInputWrapper>
                {validationErrors.fullName && (
                  <span className="text-[11px] font-medium text-red-400 pl-1 block">
                    {validationErrors.fullName}
                  </span>
                )}
              </div>
            )}

            {/* Email field */}
            <div className="animate-fade-up delay-300 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 ml-1 tracking-widest uppercase">
                E-mail
              </label>
              <GlassInputWrapper icon={Mail} hasError={Boolean(validationErrors.email)}>
                <input
                  name="email"
                  type="email"
                  disabled={busy}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  placeholder="concurseiro@email.com"
                  className="w-full bg-transparent text-sm py-3.5 pr-4 focus:outline-none text-white placeholder:text-slate-600 font-medium disabled:opacity-60"
                />
              </GlassInputWrapper>
              {validationErrors.email && (
                <span className="text-[11px] font-medium text-red-400 pl-1 block">
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Password field */}
            {mode !== "forgot" && (
              <div className="animate-fade-up delay-400 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 ml-1 tracking-widest uppercase">
                  Senha
                </label>
                <GlassInputWrapper icon={Lock} hasError={Boolean(validationErrors.password)}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    disabled={busy}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    placeholder={
                      mode === "signup" ? "Mínimo 8 caracteres (A-Z, a-z, 0-9)" : "••••••••••••"
                    }
                    className="w-full bg-transparent text-sm py-3.5 pr-12 focus:outline-none text-white placeholder:text-slate-600 font-medium tracking-normal disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center group z-10 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff
                        size={16}
                        className="text-slate-500 hover:text-white transition-colors"
                      />
                    ) : (
                      <Eye
                        size={16}
                        className="text-slate-500 hover:text-white transition-colors"
                      />
                    )}
                  </button>
                </GlassInputWrapper>
                {validationErrors.password && (
                  <span className="text-[11px] font-medium text-red-400 pl-1 block">
                    {validationErrors.password}
                  </span>
                )}
              </div>
            )}

            {/* Confirm Password field in signup mode */}
            {mode === "signup" && (
              <div className="animate-fade-up delay-450 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 ml-1 tracking-widest uppercase">
                  Confirmar Senha
                </label>
                <GlassInputWrapper icon={Lock} hasError={Boolean(validationErrors.confirmPassword)}>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={busy}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (validationErrors.confirmPassword) {
                        setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }
                    }}
                    placeholder="Repita sua senha"
                    className="w-full bg-transparent text-sm py-3.5 pr-12 focus:outline-none text-white placeholder:text-slate-600 font-medium tracking-normal disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-4 flex items-center group z-10 disabled:opacity-50"
                  >
                    {showConfirmPassword ? (
                      <EyeOff
                        size={16}
                        className="text-slate-500 hover:text-white transition-colors"
                      />
                    ) : (
                      <Eye
                        size={16}
                        className="text-slate-500 hover:text-white transition-colors"
                      />
                    )}
                  </button>
                </GlassInputWrapper>
                {validationErrors.confirmPassword && (
                  <span className="text-[11px] font-medium text-red-400 pl-1 block">
                    {validationErrors.confirmPassword}
                  </span>
                )}
              </div>
            )}

            {/* Remember Me / Forgot Password options in signin mode */}
            {mode === "signin" && (
              <div className="animate-fade-up delay-400 flex items-center justify-between text-xs px-1 mt-1">
                <label
                  className={cn(
                    "flex items-center gap-2 cursor-pointer group",
                    busy && "pointer-events-none opacity-60",
                  )}
                  onClick={() => !busy && setRememberMe(!rememberMe)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border transition-all duration-300 flex items-center justify-center",
                      rememberMe
                        ? "bg-slate-300 border-slate-300"
                        : "bg-transparent border-slate-600",
                    )}
                  >
                    <Check
                      size={12}
                      strokeWidth={4}
                      className={cn(
                        "text-slate-950 transition-transform duration-300",
                        rememberMe ? "scale-100 opacity-100" : "scale-0 opacity-0",
                      )}
                    />
                  </div>
                  <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                    Manter conectado
                  </span>
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => switchMode("forgot")}
                  className="text-slate-400 font-medium hover:text-white transition-colors hover:underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Problemas para entrar?
                </button>
              </div>
            )}

            {/* Back to signin in forgot mode */}
            {mode === "forgot" && (
              <div className="animate-fade-up delay-400 flex items-center justify-start text-xs px-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => switchMode("signin")}
                  className="flex items-center gap-2 text-slate-400 font-medium hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={14} />
                  Voltar para o Login
                </button>
              </div>
            )}

            {/* Submit Button with Loader2 Spinner and active lock */}
            <button
              disabled={busy}
              aria-busy={busy}
              type="submit"
              className="animate-fade-up delay-500 group relative w-full rounded-full bg-[#10b981] text-[#020813] font-bold text-sm py-4 mt-2 transition-all hover:bg-[#0ea5e9] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900 shrink-0" />
                    <span>
                      {mode === "signin"
                        ? "Entrando no Portal..."
                        : mode === "signup"
                          ? "Criando Conta..."
                          : "Enviando Link..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "signin"
                        ? "Entrar no Portal"
                        : mode === "signup"
                          ? "Cadastrar e Começar"
                          : "Enviar Link de Recuperação"}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Mode Switcher Footer Links */}
          {mode === "signin" && (
            <div className="animate-fade-up delay-500 text-center text-xs text-slate-400">
              Não tem uma conta?{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() => switchMode("signup")}
                className="text-emerald-400 font-bold hover:underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cadastre-se gratuitamente
              </button>
            </div>
          )}

          {mode === "signup" && (
            <div className="animate-fade-up delay-500 text-center text-xs text-slate-400">
              Já tem uma conta?{" "}
              <button
                type="button"
                disabled={busy}
                onClick={() => switchMode("signin")}
                className="text-emerald-400 font-bold hover:underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Entrar no Portal
              </button>
            </div>
          )}

          {/* OAuth options */}
          {mode !== "forgot" && (
            <>
              <div className="animate-fade-up delay-500 relative flex items-center justify-center">
                <span className="w-full border-t border-emerald-900/40"></span>
                <span className="px-4 text-[10px] font-medium uppercase tracking-widest text-slate-500 bg-[#020813] absolute">
                  Ou Acesso Rápido
                </span>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={onGoogleSignIn}
                className={cn(
                  "animate-fade-up delay-500 w-full flex items-center justify-center gap-3 border border-white/5 bg-[#0a1122] rounded-full py-3.5 hover:bg-white/5 transition-all text-slate-300 font-medium text-sm cursor-pointer",
                  busy && "opacity-50 cursor-not-allowed pointer-events-none",
                )}
              >
                <GoogleIcon />
                Continuar com o Google
              </button>
            </>
          )}
        </div>
      </motion.section>

      {/* Right column: animated hero banner */}
      <motion.section
        className="hidden md:block absolute top-0 right-0 bottom-0 pointer-events-none z-20"
        initial={{ width: "50%", padding: "16px", paddingLeft: 0 }}
        animate={
          successFading
            ? { width: "100%", padding: 0 }
            : { width: "50%", padding: "16px", paddingLeft: 0 }
        }
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="w-full h-full relative overflow-hidden bg-[#0a1628] border border-white/5 shadow-2xl"
          initial={{ borderRadius: "2rem" }}
          animate={successFading ? { borderRadius: "0rem" } : { borderRadius: "2rem" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Abstract dashboard silhouette behind the glass */}
          <div className="absolute inset-0 overflow-hidden select-none flex">
            {/* Sidebar mockup */}
            <div className="w-56 hidden lg:flex flex-col border-r border-white/5 p-4 bg-[#060e1a] gap-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20" />
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-20 bg-white/10 rounded" />
                  <div className="h-2 w-14 bg-emerald-500/15 rounded" />
                </div>
              </div>
              <div className="text-[9px] font-semibold text-white/20 uppercase tracking-wider mb-1">
                Estudo Ativo
              </div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-8 w-full rounded-lg bg-white/[0.03] border border-white/[0.04]"
                />
              ))}
            </div>
            {/* Main content area */}
            <div className="flex-1 flex flex-col pt-6 px-6 gap-4 overflow-hidden">
              {/* Header bar */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col gap-1.5">
                  <div className="h-3 w-24 bg-emerald-500/15 rounded" />
                  <div className="h-5 w-36 bg-white/15 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="w-48 h-8 bg-white/[0.04] rounded-lg border border-white/[0.06]" />
                  <div className="w-8 h-8 bg-white/[0.04] rounded-lg border border-white/[0.06]" />
                </div>
              </div>
              {/* KPI cards row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { color: "bg-blue-500/15", border: "border-blue-500/10" },
                  { color: "bg-emerald-500/15", border: "border-emerald-500/10" },
                  { color: "bg-amber-500/15", border: "border-amber-500/10" },
                  { color: "bg-purple-500/15", border: "border-purple-500/10" },
                ].map((card, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 bg-white/[0.02] border ${card.border} flex flex-col gap-2`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="h-2 w-16 bg-white/10 rounded" />
                      <div className={`w-6 h-6 rounded-lg ${card.color}`} />
                    </div>
                    <div className="h-5 w-12 bg-white/20 rounded" />
                    <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${card.color} rounded-full`}
                        style={{ width: "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Chart area */}
              <div className="h-32 w-full rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                <div className="h-2 w-28 bg-white/10 rounded mb-3" />
                <div className="flex items-end gap-1.5 h-16">
                  {Array(12)
                    .fill(0)
                    .map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-emerald-500/20 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                </div>
              </div>
              {/* Quick action cards */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 flex flex-col gap-2"
                  >
                    <div className="h-2 w-16 bg-white/10 rounded" />
                    <div className="h-2 w-24 bg-white/[0.06] rounded" />
                    <div className="h-2 w-12 bg-emerald-500/15 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Frosted glass overlay — fades out on login success */}
          <motion.div
            className="absolute inset-0 backdrop-blur-md bg-[#0a1628]/50"
            animate={
              successFading
                ? { backdropFilter: "blur(0px)", backgroundColor: "rgba(10,22,40,0)" }
                : { backdropFilter: "blur(12px)", backgroundColor: "rgba(10,22,40,0.5)" }
            }
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {/* Bottom gradient + text */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-[#020813] via-[#020813]/40 to-transparent opacity-90"
            animate={successFading ? { opacity: 0 } : { opacity: 0.9 }}
            transition={{ duration: 0.5 }}
          />

          <motion.div
            className="absolute bottom-16 left-12 right-12 z-30"
            animate={successFading ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
              Evolua seu Estudo.
            </h2>
            <p className="text-emerald-500 font-medium text-sm tracking-wide">
              Desempenho máximo <span className="text-emerald-500">para</span> sua aprovação.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>
    </div>
  );
}
