import { localeFromCookie, translator, type ErrorCode } from "@/i18n";
import { getDB } from "../db";
import { arenaService, ArenaError, hashToken } from "./arena";
import { artifacts } from "./catalog";
import { isIP } from "node:net";
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
  const header = process.env.VERCEL
    ? "x-forwarded-for"
    : process.env.ODD_CLIENT_IP_HEADER;
  let ip = "local";
  if (header) {
    // Only trust a header that the deployment gateway overwrites itself.
    ip = request.headers.get(header)?.split(",")[0]?.trim() || "";
    if (!isIP(ip))
      throw new Error("The trusted client IP header is missing or invalid.");
  } else if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Configure ODD_CLIENT_IP_HEADER for the trusted deployment gateway.",
    );
  }
  return hashToken(`${new Date().toISOString().slice(0, 10)}:${action}:${ip}`);
}
