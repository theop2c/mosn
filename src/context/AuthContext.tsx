import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { UserProfile } from "../types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdTokenResult();
        setIsAdmin(token.claims.admin === true);
      } else {
        setIsAdmin(false);
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    // Crée le doc profil s'il n'existe pas (connexion Google, anonyme…)
    void getDoc(ref).then((snap) => {
      if (snap.exists()) return;
      const displayName =
        user.displayName ?? (user.isAnonymous ? "Invité" : "Utilisateur");
      return setDoc(ref, {
        displayName,
        displayNameLower: displayName.toLowerCase(),
        bio: "",
        createdAt: serverTimestamp(),
      });
    });
    return onSnapshot(ref, (snap) => {
      setProfile((snap.data() as UserProfile | undefined) ?? null);
    });
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
