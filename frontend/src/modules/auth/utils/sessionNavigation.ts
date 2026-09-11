const RETURN_PATH_KEY = "gidas:auth:return-path:v1";

export function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

export function rememberSessionPath(path: string, storage: Storage = sessionStorage) {
  if (isSafeInternalPath(path) && !path.startsWith("/login")) {
    storage.setItem(RETURN_PATH_KEY, path);
  }
}

export function consumeSessionPath(storage: Storage = sessionStorage): string | null {
  const path = storage.getItem(RETURN_PATH_KEY);
  storage.removeItem(RETURN_PATH_KEY);
  return path && isSafeInternalPath(path) ? path : null;
}
