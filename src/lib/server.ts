import { localeFromCookie, translator, type ErrorCode } from "@/i18n";
import { getDB } from "../db";
import { arenaService, ArenaError, hashToken } from "./arena";
import { artifacts } from "./catalog";
export async function service() {
  return arenaService(await getDB(), artifacts);
}
export const privateHeaders = { "Cache-Control": "private, no-store" };
export function errorResponse(
  code: ErrorCode,
  status: number,
  request: Request,
) {
  const t = translator(localeFromCookie(request.headers.get("cookie")));
  return Response.json(
    { code, error: t(`errors.${code}`) },
    { status, headers: privateHeaders },
  );
}
export function failure(error: unknown, request: Request) {
  if (error instanceof ArenaError)
    return errorResponse(error.code, error.status, request);
  console.error(
    "Arena operation failed",
    error instanceof Error ? error.message : "unknown error",
  );
  return errorResponse("unavailable", 503, request);
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (origin && origin !== expected) throw new ArenaError(403, "origin");
}
export function rateKey(request: Request, action: string) {
  const ip = process.env.VERCEL
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "local";
  return hashToken(`${new Date().toISOString().slice(0, 10)}:${action}:${ip}`);
}
