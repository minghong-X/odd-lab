import { service, failure, errorResponse } from "@/lib/server";
import { getExperiment } from "@/lib/catalog";
import { javaArena, javaOrigin } from "@/lib/java-arena";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const experiment =
      new URL(request.url).searchParams.get("experiment") || "pelican";
    if (!getExperiment(experiment))
      return errorResponse("experimentNotFound", 404, request);
    const origin = javaOrigin();
    const arena = origin ? javaArena(origin) : await service();
    return Response.json(await arena.leaderboard(experiment), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e, request);
  }
}
