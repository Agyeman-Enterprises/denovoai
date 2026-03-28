export async function GET() {
  return Response.json({
    status: "ok",
    service: "denovo-auth-snippet",
    version: "1.0.0",
  });
}
