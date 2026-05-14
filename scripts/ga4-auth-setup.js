/**
 * GA4 OAuth 인증 셋업
 *
 * 1회만 실행하면 됨. 브라우저에서 Google 로그인 → 토큰 저장.
 *
 * 사전 준비:
 *   Google Cloud Console → APIs & Services → Credentials
 *   → "+ CREATE CREDENTIALS" → "OAuth client ID"
 *   → Application type: "Desktop app"
 *   → 이름: ga4-reader
 *   → "CREATE" → JSON 다운로드
 *   → 파일명을 ga4-oauth-client.json 으로 저장 (프로젝트 루트)
 */

const { google } = require("googleapis");
const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

const CLIENT_PATH = path.join(__dirname, "..", "ga4-oauth-client.json");
const TOKEN_PATH = path.join(__dirname, "..", "ga4-oauth-token.json");

async function main() {
  if (!fs.existsSync(CLIENT_PATH)) {
    console.error("ga4-oauth-client.json 파일이 없습니다.");
    console.error("위 주석의 사전 준비를 따라주세요.");
    process.exit(1);
  }

  const clientJson = JSON.parse(fs.readFileSync(CLIENT_PATH, "utf8"));
  const { client_id, client_secret } = clientJson.installed || clientJson.web;

  const oauth2 = new google.auth.OAuth2(
    client_id,
    client_secret,
    "http://localhost:3847/callback"
  );

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/analytics.readonly"],
  });

  console.log("\n브라우저에서 로그인 중...\n");

  // 로컬 서버로 콜백 받기
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, "http://localhost:3847");
      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h2>인증 완료! 이 창을 닫아도 됩니다.</h2>");
        server.close();
        resolve(code);
      }
    });
    server.listen(3847, () => {
      const { execSync } = require("child_process");
      execSync(`open "${authUrl}"`);
    });
    server.on("error", reject);
  });

  const { tokens } = await oauth2.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log("토큰 저장 완료:", TOKEN_PATH);
  console.log("\n이제 node scripts/ga4-report.js 를 실행하세요.\n");
}

main().catch(console.error);
