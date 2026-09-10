import { service, failure, errorResponse } from "@/lib/server";
import { getExperiment } from "@/lib/catalog";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const experiment =
      new URL(request.url).searchParams.get("experiment") || "pelican";
    if (!getExperiment(experiment))
      return errorResponse("experimentNotFound", 404, request);
    return Response.json(await (await service()).leaderboard(experiment), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e, request);
  }
}
