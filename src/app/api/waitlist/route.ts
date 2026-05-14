import { NextRequest, NextResponse } from 'next/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const notionKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_WAITLIST_DB_ID;

  if (!notionKey || !dbId) {
    return NextResponse.json({ error: 'server_config' }, { status: 500 });
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notionKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties: {
        이름: { title: [{ text: { content: email } }] },
        이메일: { email },
        제출일: { date: { start: new Date().toISOString() } },
        관심도: { select: { name: 'yes' } },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Notion API error:', res.status, body);
    return NextResponse.json({ error: 'notion_error' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
