import { HttpError, http } from "@/lib/http";

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
const LOGIN_ERROR_MESSAGE =
  "Lo sentimos, no pudimos iniciar sesión. Verifique su usuario y contraseña e intente nuevamente.";
const CONNECTION_ERROR_MESSAGE =
  "Lo sentimos, no pudimos conectar con el servidor. Intente nuevamente en unos minutos.";
const CHANGE_PASSWORD_ERROR_MESSAGE =
  "Lo sentimos, no pudimos cambiar la contraseña. Verifique los datos e intente nuevamente.";

function getBackendErrorMessage(error: HttpError): string | null {
  const body = error.body;

  if (typeof body === "string") {
    return body.trim() || null;
  }

  if (body && typeof body === "object") {
    const parsedBody = body as Record<string, unknown>;
    const errorMessage = parsedBody.error;
    const message = parsedBody.message;

    if (typeof errorMessage === "string" && errorMessage.trim()) {
      return errorMessage;
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return null;
}

function storeAuth(auth: AuthResponse) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function getStoredAuth(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export async function restoreSession(): Promise<AuthResponse | null> {
  const stored = getStoredAuth();
  if (!stored?.token) return null;

  try {
    const user = await http<User>("/auth/perfil", { method: "GET" });
    const refreshed = getStoredAuth();
    const auth = {
      ...(refreshed ?? stored),
      user,
    };

    return auth;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export async function login(
  usuario: string,
  password: string
): Promise<AuthResponse> {
  let responseBack: BackendLoginResponse;

  try {
    responseBack = await http<BackendLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        nombre_usuario: usuario,
        password,
      }),
    });
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      throw new Error(LOGIN_ERROR_MESSAGE);
    }

    throw new Error(CONNECTION_ERROR_MESSAGE);
  }

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

  try {
    await http("/auth/cambiar-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      const backendMessage = getBackendErrorMessage(error);
      throw new Error(backendMessage ?? CHANGE_PASSWORD_ERROR_MESSAGE);
    }

    throw new Error(CONNECTION_ERROR_MESSAGE);
  }
}

export function logout() {
  const stored = getStoredAuth();
  if (stored?.refresh_token) {
    void http("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: stored.refresh_token }),
    }).catch(() => undefined);
  }

  localStorage.removeItem(AUTH_KEY);
  window.location.href = "/login";
}
