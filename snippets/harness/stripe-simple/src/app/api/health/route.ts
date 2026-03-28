export async function GET() {
  return Response.json({
    status: "ok",
    service: "denovo-stripe-simple-snippet",
    version: "1.0.0",
  });
}
