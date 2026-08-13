import {
  HttpError,
  clearAccessToken,
  http,
  refreshSession,
  setAccessToken,
  withAuthCookieLock,
} from "@/lib/http";

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
};

type BackendLoginResponse = {
  access_token: string;
  user?: User;
  usuario?: User;
};

const AUTH_CHANNEL = "gidas_auth_events";
const LEGACY_AUTH_KEY = "gidas_auth_current_session";
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

export async function restoreSession(): Promise<AuthResponse | null> {
  removeLegacyAuthStorage();
  const response = await refreshSession<User>();
  const user = response?.user ?? response?.usuario;
  if (!response?.access_token || !user) return null;

  return { user, token: response.access_token };
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
    }, true);
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      throw new Error(LOGIN_ERROR_MESSAGE);
    }

    throw new Error(CONNECTION_ERROR_MESSAGE);
  }

  const auth: AuthResponse = {
    user: responseBack.user ?? responseBack.usuario!,
    token: responseBack.access_token,
  };

  if (!auth.user || !auth.token) {
    clearAccessToken();
    throw new Error(CONNECTION_ERROR_MESSAGE);
  }

  setAccessToken(auth.token);
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

export async function logout(): Promise<void> {
  clearAccessToken();
  publishAuthEvent("logout");

  try {
    await withAuthCookieLock(() =>
      http(
        "/auth/logout",
        {
          method: "POST",
        },
        true
      )
    );
  } catch {
    // La limpieza local debe completarse aunque la sesion ya haya expirado.
  }
}

export function subscribeToAuthEvents(onLogout: () => void): () => void {
  if (!("BroadcastChannel" in window)) return () => undefined;

  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (event.data === "logout") onLogout();
  });

  return () => channel.close();
}

function publishAuthEvent(event: "logout") {
  if (!("BroadcastChannel" in window)) return;

  const channel = new BroadcastChannel(AUTH_CHANNEL);
  channel.postMessage(event);
  channel.close();
}

function removeLegacyAuthStorage() {
  localStorage.removeItem(LEGACY_AUTH_KEY);
  sessionStorage.removeItem(LEGACY_AUTH_KEY);
}
