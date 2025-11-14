import { NextRequest } from "next/server";
import { fetchGoogleNews, sortByDateDesc } from "@/lib/rss";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;

    const articles = await fetchGoogleNews(q);
    const sorted = sortByDateDesc(articles).slice(0, 50);

    return new Response(JSON.stringify({ articles: sorted }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(e?.message ?? "Internal error", { status: 500 });
  }
}
