import { http } from "@/lib/http";

export type Rol = "ADMIN" | "GESTOR" | "LECTURA";

export type User = {
  id: number;
  nombre_usuario: string;
  mail: string;
  rol: Rol;
  primer_login: boolean;
  activo?: boolean;
};

export type AuthResponse = {
  user: User;
  token: string;
  refresh_token?: string;
};

type BackendLoginResponse = {
  access_token: string;
  refresh_token: string;
  user: User;
};

const AUTH_KEY = "gidas_auth_current_session";

function storeAuth(auth: AuthResponse) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function getStoredAuth(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? (JSON.parse(raw) as AuthResponse) : null;
}

export async function login(
  usuario: string,
  password: string
): Promise<AuthResponse> {
  const responseBack = await http<BackendLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      nombre_usuario: usuario,
      password,
    }),
  });

  const auth: AuthResponse = {
    user: responseBack.user,
    token: responseBack.access_token,
    refresh_token: responseBack.refresh_token,
  };

  storeAuth(auth);
  return auth;
}

export async function register(
  usuario: string,
  email: string,
  password: string
): Promise<void> {
  await http("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      nombre_usuario: usuario,
      mail: email,
      password,
    }),
  });
}

export async function esPrimerUsuario(): Promise<boolean> {
  try {
    const response = await http<{ existe: boolean }>("/auth/primer-usuario", {
      method: "GET",
    });
    return !response.existe;
  } catch {
    return false;
  }
}

type CambiarPasswordParams = {
  passwordNueva: string;
  passwordActual?: string;
};

export async function cambiarPassword({
  passwordNueva,
  passwordActual,
}: CambiarPasswordParams): Promise<void> {
  const body: Record<string, string> = {
    password_nueva: passwordNueva,
    password_confirmacion: passwordNueva,
  };

  if (passwordActual?.trim()) {
    body.password_actual = passwordActual;
  }

  await http("/auth/cambiar-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "/login";
}