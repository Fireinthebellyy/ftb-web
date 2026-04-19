const AUTH_OVERLAY_BASE_ROUTES = [
  "/opportunities",
  "/toolkit",
  "/tracker",
  "/intern",
  "/ungatekeep",
] as const;

const normalizePath = (path: string): string => {
  if (!path) {
    return "/";
  }

  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
};

export const supportsAuthOverlay = (path: string): boolean => {
  const normalizedPath = normalizePath(path);

  return AUTH_OVERLAY_BASE_ROUTES.some(
    (baseRoute) =>
      normalizedPath === baseRoute || normalizedPath.startsWith(`${baseRoute}/`)
  );
};

