export async function GET() {
  return Response.json({ status: "ok", service: "{{APP_SLUG}}-content", version: "1.0.0" });
}
