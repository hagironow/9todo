const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Env {
  NOTION_API_KEY: string;
  NOTION_WAITLIST_DB_ID: string;
}

interface RequestBody {
  email: string;
  interest?: string;
  price?: string;
  regret?: string;
  ageGroup?: string;
  job?: string;
  jobCustom?: string;
  interview?: boolean;
  daysSinceFirstUse?: number;
  taskCount?: number;
  routineCount?: number;
  completed?: boolean;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json() as RequestBody;
    const { email } = body;

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

    // 기본 속성 (웨이팅리스트 모달 — 이메일만)
    const properties: Record<string, unknown> = {
      메일: { title: [{ text: { content: email } }] },
      이메일: { email },
      제출일: { date: { start: new Date().toISOString() } },
      관심도: { select: { name: body.interest || 'yes' } },
    };

    // 설문 데이터가 있으면 추가 (LoginModal 경로)
    if (body.price) {
      properties['가격선택'] = { select: { name: body.price } };
    }
    if (body.regret) {
      properties['아쉬움 정도'] = { select: { name: body.regret } };
    }
    if (body.ageGroup) {
      properties['연령대'] = { select: { name: body.ageGroup } };
    }
    if (body.job) {
      properties['직업군'] = { select: { name: body.job } };
    }
    if (body.jobCustom) {
      properties['직업상세'] = { rich_text: [{ text: { content: body.jobCustom } }] };
    }
    if (body.interview !== undefined) {
      properties['인터뷰 참여'] = { checkbox: body.interview };
    }
    if (body.daysSinceFirstUse !== undefined) {
      properties['사용일수'] = { number: body.daysSinceFirstUse };
    }
    if (body.taskCount !== undefined) {
      properties['태스크 생성수'] = { number: body.taskCount };
    }
    if (body.routineCount !== undefined) {
      properties['루틴 생성수'] = { number: body.routineCount };
    }
    if (body.completed !== undefined) {
      properties['완료 여부'] = { checkbox: body.completed };
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
        properties,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Notion API error:', res.status, text);
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
