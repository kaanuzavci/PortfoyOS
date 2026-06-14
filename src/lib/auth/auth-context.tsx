// Kimlik doğrulama bağlamı.
// Firebase yapılandırılmışsa gerçek Firebase Auth; aksi halde yerel demo modu
// (uygulamanın kimlik bilgisi olmadan da çalışması için). Auth olmadan veri görünmez.
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth as firebaseAuth, isFirebaseConfigured } from "@/lib/firebase/config";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

type AuthMode = "firebase" | "local";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  mode: AuthMode;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOCAL_KEY = "portfoyos-auth-v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode: AuthMode = isFirebaseConfigured ? "firebase" : "local";
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode === "firebase" && firebaseAuth) {
      let unsub = () => {};
      (async () => {
        const { onAuthStateChanged } = await import("firebase/auth");
        unsub = onAuthStateChanged(firebaseAuth, (fu) => {
          setUser(
            fu
              ? { uid: fu.uid, email: fu.email, displayName: fu.displayName }
              : null,
          );
          setLoading(false);
        });
      })();
      return () => unsub();
    }
    // Yerel mod: kayıtlı oturumu oku
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* yok say */
    }
    setLoading(false);
  }, [mode]);

  const persistLocal = (u: AppUser | null) => {
    if (u) localStorage.setItem(LOCAL_KEY, JSON.stringify(u));
    else localStorage.removeItem(LOCAL_KEY);
    setUser(u);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      mode,
      async signIn(email, password) {
        if (mode === "firebase" && firebaseAuth) {
          const { signInWithEmailAndPassword } = await import("firebase/auth");
          await signInWithEmailAndPassword(firebaseAuth, email, password);
          return;
        }
        if (!email || !password) throw new Error("E-posta ve şifre gerekli.");
        persistLocal({
          uid: "local-" + btoa(email).slice(0, 12),
          email,
          displayName: email.split("@")[0],
        });
      },
      async signUp(email, password, name) {
        if (mode === "firebase" && firebaseAuth) {
          const { createUserWithEmailAndPassword, updateProfile } = await import(
            "firebase/auth"
          );
          const cred = await createUserWithEmailAndPassword(
            firebaseAuth,
            email,
            password,
          );
          if (name) await updateProfile(cred.user, { displayName: name });
          return;
        }
        if (!email || !password) throw new Error("E-posta ve şifre gerekli.");
        persistLocal({
          uid: "local-" + btoa(email).slice(0, 12),
          email,
          displayName: name ?? email.split("@")[0],
        });
      },
      async signInWithGoogle() {
        if (mode === "firebase" && firebaseAuth) {
          const { GoogleAuthProvider, signInWithPopup } = await import(
            "firebase/auth"
          );
          await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
          return;
        }
        persistLocal({
          uid: "local-google",
          email: "demo@portfoyos.app",
          displayName: "Demo Kullanıcı",
        });
      },
      async signOut() {
        if (mode === "firebase" && firebaseAuth) {
          const { signOut: fbSignOut } = await import("firebase/auth");
          await fbSignOut(firebaseAuth);
          return;
        }
        persistLocal(null);
      },
    }),
    [user, loading, mode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
