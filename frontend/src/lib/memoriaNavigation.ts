import type { Location, NavigateFunction } from "react-router-dom";

type NavigationState = Record<string, unknown>;

function asNavigationState(state: unknown): NavigationState | null {
  if (!state || typeof state !== "object") return null;
  return state as NavigationState;
}

export function buildMemoriaDetailState(
  location: Pick<Location, "pathname" | "search" | "state">
): NavigationState | undefined {
  const state = asNavigationState(location.state);

  if (!state?.memoriaFilter) {
    return undefined;
  }

  return {
    ...state,
    memoriaReturnTo: `${location.pathname}${location.search}`,
  };
}

export function stripSuccessMessageState(state: unknown): NavigationState | undefined {
  const currentState = asNavigationState(state);
  if (!currentState) return undefined;

  const { successMessage, ...rest } = currentState;
  void successMessage;

  return Object.keys(rest).length > 0 ? rest : undefined;
}

export function navigateBackFromMemoriaContext(
  navigate: NavigateFunction,
  location: Pick<Location, "state">,
  fallbackPath: string
) {
  const state = asNavigationState(location.state);
  const searchReturnTo = state?.searchReturnTo;

  if (typeof searchReturnTo === "string") {
    navigate(searchReturnTo);
    return;
  }

  const memoriaFilter = state?.memoriaFilter;
  const memoriaReturnTo = state?.memoriaReturnTo;

  if (memoriaFilter && typeof memoriaReturnTo === "string") {
    navigate(memoriaReturnTo, {
      state: { memoriaFilter },
    });
    return;
  }

  navigate(fallbackPath);
}
