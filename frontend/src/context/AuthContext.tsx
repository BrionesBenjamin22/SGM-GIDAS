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
  getStoredAuth,
  restoreSession,
  esPrimerUsuario as esPrimerUsuarioService,
  cambiarPassword as cambiarPasswordService,
  type User,
  type Rol,
  type AuthResponse,
} from "@/services/authService";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (usuario: string, password: string) => Promise<AuthResponse>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => void;
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

const AUTH_KEY = "gidas_auth_current_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initializeSession() {
      setLoading(true);
      const stored = await restoreSession();

      if (!active) return;

      setUser(stored?.user ?? null);
      setToken(stored?.token ?? null);
      setLoading(false);
    }

    void initializeSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    async function handleStorage(event: StorageEvent) {
      if (event.key === AUTH_KEY) {
        setLoading(true);
        const stored = await restoreSession();
        setUser(stored?.user ?? null);
        setToken(stored?.token ?? null);
        setLoading(false);
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function persistUser(updatedUser: User) {
    setUser(updatedUser);

    const stored = getStoredAuth();
    if (stored) {
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({
          ...stored,
          user: updatedUser,
        })
      );
    }
  }

  function updateUserInSession(partial: Partial<User>) {
    if (!user) return;
    const updatedUser = { ...user, ...partial };
    persistUser(updatedUser);
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
      persistUser({ ...user, primer_login: false });
    }
  }

  function logout() {
    logoutService();
    setUser(null);
    setToken(null);
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
    return true;
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
