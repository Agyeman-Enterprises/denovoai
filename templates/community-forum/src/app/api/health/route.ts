export async function GET() {
  return Response.json({ status: "ok", service: "{{APP_SLUG}}-community", version: "1.0.0" });
}
