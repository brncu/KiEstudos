import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, clearAppSessionData } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Listen to Supabase auth events
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        clearAppSessionData();
        setSession(null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setSession(newSession);
        setLoading(false);
        return;
      }

      setSession(newSession);
      setLoading(false);
    });

    // Server-side verification with supabase.auth.getUser()
    // Avoids trusting unverified local session cache alone (Checklist Top 19 Rule 5)
    supabase.auth
      .getUser()
      .then(async ({ data: { user }, error }) => {
        if (!isMounted) return;

        if (error || !user) {
          setSession(null);
          setLoading(false);
          return;
        }

        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (isMounted) {
            setSession(sessionData.session);
            setLoading(false);
          }
        } catch (sessionErr) {
          console.warn("[Auth Security] Error getting session after getUser:", sessionErr);
          if (isMounted) {
            setSession(null);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        // Avoid infinite loading: true state if network or storage fails
        console.error("[Auth Security] Server authentication verification failed:", err);
        if (isMounted) {
          setSession(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[Auth Security] Sign out error:", err);
    } finally {
      clearAppSessionData();
      setSession(null);
    }
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signOut,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

