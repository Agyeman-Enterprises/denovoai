import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { html, title } = await request.json();

  // Simple HTML-to-PDF stub — in production use puppeteer or @react-pdf/renderer
  // For the snippet, we return the HTML wrapped in a printable page
  const printableHtml = `<!DOCTYPE html>
<html><head><title>${title || "Export"}</title>
<style>body{font-family:system-ui;padding:40px;max-width:800px;margin:0 auto}
h1{font-size:24px;margin-bottom:16px}table{width:100%;border-collapse:collapse}
td,th{border:1px solid #ddd;padding:8px;text-align:left}</style>
</head><body>${html}</body></html>`;

  return new Response(printableHtml, {
    headers: { "Content-Type": "text/html", "Content-Disposition": `inline; filename="${title || "export"}.html"` },
  });
}
