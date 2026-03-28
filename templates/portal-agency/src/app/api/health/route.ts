export async function GET() {
  return Response.json({ status: "ok", service: "{{APP_SLUG}}-portal", version: "1.0.0" });
}
