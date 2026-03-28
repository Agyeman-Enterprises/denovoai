export async function GET() {
  return Response.json({
    status: "ok",
    service: "denovo-snippet-harness",
    version: "1.0.0",
  });
}
