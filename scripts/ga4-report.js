/**
 * GA4 Data API — 핵심 지표 리포트
 *
 * 사용법: node scripts/ga4-report.js [days]
 * 예: node scripts/ga4-report.js 7
 */

const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const PROPERTY_ID = "536650818";
const CLIENT_PATH = path.join(__dirname, "..", "ga4-oauth-client.json");
const TOKEN_PATH = path.join(__dirname, "..", "ga4-oauth-token.json");

const clientJson = JSON.parse(fs.readFileSync(CLIENT_PATH, "utf8"));
const { client_id, client_secret } = clientJson.installed || clientJson.web;
const oauth2 = new google.auth.OAuth2(client_id, client_secret);
oauth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8")));

const client = new BetaAnalyticsDataClient({
  authClient: oauth2,
});

const days = parseInt(process.argv[2] || "7", 10);

async function runReport() {
  const dateRange = { startDate: `${days}daysAgo`, endDate: "today" };

  // ── 1. 기본 지표 ──
  const [overview] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "averageSessionDuration" },
      { name: "screenPageViews" },
      { name: "newUsers" },
    ],
  });

  const ov = overview.rows?.[0]?.metricValues || [];
  console.log("═══════════════════════════════════════════");
  console.log(`  9todo GA4 리포트 (최근 ${days}일)`);
  console.log("═══════════════════════════════════════════");
  console.log(`  활성 유저:       ${ov[0]?.value || 0}명`);
  console.log(`  세션 수:         ${ov[1]?.value || 0}회`);
  console.log(
    `  평균 세션 시간:  ${Math.round(parseFloat(ov[2]?.value || 0))}초`
  );
  console.log(`  페이지뷰:        ${ov[3]?.value || 0}회`);
  console.log(`  신규 유저:       ${ov[4]?.value || 0}명`);

  // ── 2. 채널별 유입 ──
  const [channels] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [
      { name: "firstUserSource" },
      { name: "firstUserMedium" },
    ],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: 15,
  });

  console.log("\n─── 채널별 유입 ───");
  console.log("  소스/매체                    유저   세션");
  for (const row of channels.rows || []) {
    const src = row.dimensionValues[0].value;
    const med = row.dimensionValues[1].value;
    const users = row.metricValues[0].value;
    const sessions = row.metricValues[1].value;
    const label = `${src} / ${med}`.padEnd(30);
    console.log(`  ${label} ${users.padStart(4)}   ${sessions.padStart(4)}`);
  }

  // ── 3. 이벤트별 수 ──
  const [events] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 20,
  });

  console.log("\n─── 이벤트 ───");
  console.log("  이벤트                       횟수   유저");
  for (const row of events.rows || []) {
    const name = row.dimensionValues[0].value.padEnd(30);
    const count = row.metricValues[0].value;
    const users = row.metricValues[1].value;
    console.log(`  ${name} ${count.padStart(5)}   ${users.padStart(4)}`);
  }

  // ── 4. 일별 활성 유저 추이 ──
  const [daily] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }, { name: "newUsers" }],
    orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
  });

  console.log("\n─── 일별 추이 ───");
  console.log("  날짜        활성   신규");
  for (const row of daily.rows || []) {
    const d = row.dimensionValues[0].value;
    const dateStr = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const active = row.metricValues[0].value;
    const newU = row.metricValues[1].value;
    console.log(`  ${dateStr}    ${active.padStart(4)}   ${newU.padStart(4)}`);
  }

  // ── 5. 페이지별 조회 ──
  const [pages] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [dateRange],
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "activeUsers" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  });

  console.log("\n─── 페이지별 ───");
  console.log("  페이지                       조회   유저   평균체류(초)");
  for (const row of pages.rows || []) {
    const pg = row.dimensionValues[0].value.padEnd(30);
    const views = row.metricValues[0].value;
    const users = row.metricValues[1].value;
    const dur = Math.round(parseFloat(row.metricValues[2].value));
    console.log(
      `  ${pg} ${views.padStart(5)}   ${users.padStart(4)}   ${String(dur).padStart(6)}`
    );
  }

  console.log("\n═══════════════════════════════════════════\n");
}

runReport().catch((err) => {
  console.error("GA4 API 에러:", err.message);
  if (err.message.includes("permission")) {
    console.error(
      "\n→ GA4 Property Access Management에서 서비스 계정에 Viewer 권한을 추가했는지 확인하세요."
    );
  }
  process.exit(1);
});
