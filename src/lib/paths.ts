// Next Link/router add basePath themselves. Use this for fetch, img and plain a.
export function appPath(path: `/${string}`): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;
}
