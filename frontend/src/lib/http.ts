const BASE = import.meta.env.VITE_API_URL ?? "";
const AUTH_KEY = "gidas_auth_current_session";

function getLocalAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

function updateStoredToken(newAccessToken: string) {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return;
  const auth = JSON.parse(raw);
  auth.token = newAccessToken;
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "/login";
}

export class HttpError extends Error {
  status: number;
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const auth = getLocalAuth();
    if (!auth?.refresh_token) return null;

    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: auth.refresh_token }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (data.access_token) {
        updateStoredToken(data.access_token);
        return data.access_token as string;
      }

      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function buildHeaders(init?: RequestInit) {
  const auth = getLocalAuth();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };

  if (auth?.token) {
    headers["Authorization"] = `Bearer ${auth.token}`;
  }

  return headers;
}

async function parseErrorResponse(res: Response): Promise<unknown> {
  try {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await res.json();
    }

    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

export async function http<T>(
  path: string,
  init: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const url = `${BASE}${path}`;

  const headers = buildHeaders(init);

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 204) return undefined as T;
  if (res.status === 404) return null as T;

  if (res.status === 401 && !_isRetry) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return http<T>(path, init, true);
    }

    if (!window.location.pathname.includes("/login")) {
      logout();
    }
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    if (res.ok) return undefined as T;
  }

  if (!res.ok) {
    console.error("ERROR BACKEND:", data);
    throw new HttpError(res.status, res.statusText, data);
  }

  return data as T;
}

export async function httpDownload(
  path: string,
  init: RequestInit = {},
  _isRetry = false
): Promise<Response> {
  const url = `${BASE}${path}`;

  const headers = buildHeaders({
    ...init,
    headers: {
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream",
      ...((init.headers as Record<string, string>) || {}),
    },
  });

  if (headers["Content-Type"] && (!init.body || init.method === "GET")) {
    delete headers["Content-Type"];
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (res.status === 401 && !_isRetry) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return httpDownload(path, init, true);
    }

    if (!window.location.pathname.includes("/login")) {
      logout();
    }
  }

  if (!res.ok) {
    const data = await parseErrorResponse(res);
    console.error("ERROR BACKEND:", data);
    throw new HttpError(res.status, res.statusText, data);
  }

  return res;
}