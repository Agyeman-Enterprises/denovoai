export async function GET() {
  return Response.json({ status: "ok", service: "{{APP_SLUG}}-crm", version: "1.0.0" });
}
