export type HttpRequestInit = RequestInit & {
  allowNotFound?: boolean;
};

export function allowsNotFound(init: HttpRequestInit = {}): boolean {
  if (init.allowNotFound !== undefined) return init.allowNotFound;
  return !init.method || init.method.toUpperCase() === "GET";
}
