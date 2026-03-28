export async function GET() {
  return Response.json({ status: "ok", service: "{{APP_SLUG}}-marketplace", version: "1.0.0" });
}
