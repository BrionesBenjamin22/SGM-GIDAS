import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  restoreSession,
  subscribeToAuthEvents,
  esPrimerUsuario as esPrimerUsuarioService,
  cambiarPassword as cambiarPasswordService,
  type User,
  type Rol,
  type AuthResponse,
} from "@/modules/auth/services/authService";
import { clearAccessToken } from "@/lib/http";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (usuario: string, password: string) => Promise<AuthResponse>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  esPrimerUsuario: () => Promise<boolean>;
  cambiarPassword: (params: {
    passwordNueva: string;
    passwordActual?: string;
  }) => Promise<void>;

  isAdmin: () => boolean;
  isGestor: () => boolean;
  isLector: () => boolean;

  debeCambiarPassword: () => boolean;

  canManageUsers: () => boolean;
  canCreateRecords: () => boolean;
  canEditRecords: () => boolean;
  canDeleteRecords: () => boolean;
  canReadRecords: () => boolean;
  canEditOwnProfile: () => boolean;

  updateUserInSession: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initializeSession() {
      setLoading(true);
      try {
        const stored = await restoreSession();
        if (!active) return;
        setUser(stored?.user ?? null);
        setToken(stored?.token ?? null);
      } catch {
        if (!active) return;
        clearAccessToken();
        setUser(null);
        setToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void initializeSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const clearSession = () => {
      clearAccessToken();
      setUser(null);
      setToken(null);
    };
    const unsubscribe = subscribeToAuthEvents(clearSession);
    window.addEventListener("gidas:session-expired", clearSession);

    return () => {
      unsubscribe();
      window.removeEventListener("gidas:session-expired", clearSession);
    };
  }, []);

  function updateUserInSession(partial: Partial<User>) {
    if (!user) return;
    setUser({ ...user, ...partial });
  }

  async function login(usuario: string, password: string): Promise<AuthResponse> {
    const auth = await loginService(usuario, password);
    setUser(auth.user);
    setToken(auth.token);
    return auth;
  }

  async function register(nombre: string, email: string, password: string) {
    await registerService(nombre, email, password);
  }

  async function esPrimerUsuario() {
    return esPrimerUsuarioService();
  }

  async function cambiarPassword({
    passwordNueva,
    passwordActual,
  }: {
    passwordNueva: string;
    passwordActual?: string;
  }) {
    await cambiarPasswordService({ passwordNueva, passwordActual });

    if (user) {
      setUser({ ...user, primer_login: false });
    }
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await logoutService();
  }

  function isAdmin(): boolean {
    return user?.rol === "ADMIN";
  }

  function isGestor(): boolean {
    return user?.rol === "GESTOR";
  }

  function isLector(): boolean {
    return user?.rol === "LECTURA";
  }

  function debeCambiarPassword(): boolean {
    return user?.primer_login === true;
  }

  function canManageUsers(): boolean {
    return isAdmin();
  }

  function canCreateRecords(): boolean {
    return isAdmin() || isGestor();
  }

  function canEditRecords(): boolean {
    return isAdmin() || isGestor();
  }

  function canDeleteRecords(): boolean {
    return isAdmin() || isGestor();
  }

  function canReadRecords(): boolean {
    return !!user;
  }

  function canEditOwnProfile(): boolean {
    return !!user;
  }

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    esPrimerUsuario,
    cambiarPassword,

    isAdmin,
    isGestor,
    isLector,

    debeCambiarPassword,

    canManageUsers,
    canCreateRecords,
    canEditRecords,
    canDeleteRecords,
    canReadRecords,
    canEditOwnProfile,

    updateUserInSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
