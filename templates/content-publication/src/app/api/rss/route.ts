import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("content_items")
    .select("title, slug, excerpt, category, published_at")
    .eq("status", "published")
    .eq("is_pro_only", false)
    .order("published_at", { ascending: false })
    .limit(50);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
  const appName = "{{APP_NAME}}";
  const appTagline = "{{APP_TAGLINE}}";

  const rssItems = (items || []).map((item: Record<string, unknown>) => {
    const pubDate = item.published_at
      ? new Date(item.published_at as string).toUTCString()
      : new Date().toUTCString();

    return `    <item>
      <title><![CDATA[${item.title as string}]]></title>
      <link>${siteUrl}/${item.slug as string}</link>
      <guid>${siteUrl}/${item.slug as string}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${item.category as string}</category>
      ${item.excerpt ? `<description><![CDATA[${item.excerpt as string}]]></description>` : ""}
    </item>`;
  }).join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${appName}</title>
    <link>${siteUrl}</link>
    <description>${appTagline}</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
