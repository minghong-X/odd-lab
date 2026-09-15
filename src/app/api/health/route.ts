export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness only: no database writes, migrations or credentials in the response.
export function GET() {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
