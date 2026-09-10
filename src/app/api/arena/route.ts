import { z } from "zod";
import {
  service,
  errorResponse,
  failure,
  privateHeaders,
  checkOrigin,
  rateKey,
} from "@/lib/server";
export const runtime = "nodejs";
const input = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("pair"),
    experiment: z.enum(["pelican", "crocodile", "starship"]),
  }),
  z.object({
    action: z.literal("vote"),
    id: z.string().uuid(),
    token: z.string().min(32).max(100),
    choice: z.enum(["left", "right", "draw", "neither"]),
  }),
]);
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const text = await request.text();
    if (text.length > 2048) return errorResponse("tooLarge", 413, request);
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return errorResponse("invalidJson", 400, request);
    }
    const parsed = input.safeParse(json);
    if (!parsed.success) return errorResponse("invalidInput", 400, request);
    const arena = await service(),
      data = parsed.data;
    await arena.limit(
      rateKey(request, data.action),
      data.action === "pair" ? 40 : 80,
    );
    return Response.json(
      data.action === "pair"
        ? await arena.create(data.experiment)
        : await arena.vote(data.id, data.token, data.choice),
      { headers: privateHeaders },
    );
  } catch (e) {
    return failure(e, request);
  }
}
