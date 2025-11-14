import { NextRequest } from "next/server";

export const runtime = "nodejs";

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: false })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Telegram error: ${t}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = body.chatId || process.env.TELEGRAM_CHAT_ID;
    const messages: string[] = body.messages;

    if (!token) return new Response("Missing token", { status: 400 });
    if (!chatId) return new Response("Missing chatId", { status: 400 });
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("No messages to send", { status: 400 });
    }

    for (const m of messages) {
      await sendTelegramMessage(token, chatId, m);
    }

    return new Response(JSON.stringify({ ok: true, count: messages.length }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e?.message ?? "Internal error", { status: 500 });
  }
}
