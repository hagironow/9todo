const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Env {
  NOTION_API_KEY: string;
  NOTION_WAITLIST_DB_ID: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const { email } = await context.request.json() as { email: string };

    if (!email || !EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: 'invalid_email' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const notionKey = context.env.NOTION_API_KEY;
    const dbId = context.env.NOTION_WAITLIST_DB_ID;

    if (!notionKey || !dbId) {
      return new Response(JSON.stringify({ error: 'server_config' }), {
        status: 500,
        headers: corsHeaders,
      });
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
      return new Response(JSON.stringify({ error: 'notion_error' }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch {
    return new Response(JSON.stringify({ error: 'server_error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
