import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";
import { 處理AI請求 } from "./services/aiService/index.ts";
import { 定時器 } from "./services/scheduler/index.ts";
import { 設定App, InnerAPI } from "./services/index.ts";
import { dataPool, registerModel } from "@dui/database";
import AI伺服器 from "./database/models/AI伺服器.ts";
import 排程記錄 from "./database/models/排程記錄.ts";

const app = new Hono();

// ── 註冊資料庫 Model ──
registerModel("AI伺服器", AI伺服器);
registerModel("排程記錄", 排程記錄);

// ── 注入 app 實例給 InnerAPI ──
設定App(app);

// 靜態檔案服務
app.use(
  "/static/*",
  serveStatic({
    root: ".",
    getContent: async (path: string) => {
      try {
        return await Deno.readTextFile(path);
      } catch {
        return undefined;
      }
    },
  }),
);

// 首頁
app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-TW" data-theme="light">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>AI 中心</title>
      <link rel="stylesheet" href="/static/style.css" />
    </head>
    <body class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-lg">
        <div class="flex-1">
          <a class="btn btn-ghost text-xl">AI 中心</a>
        </div>
        <div class="flex-none gap-2">
          <button class="btn btn-primary">開始使用</button>
        </div>
      </div>

      <main class="container mx-auto p-6">
        <div class="hero min-h-[60vh]">
          <div class="hero-content text-center">
            <div class="max-w-2xl">
              <h1 class="text-5xl font-bold">AI 中心</h1>
              <p class="py-6 text-lg">Deno + Hono + TailwindCSS + DaisyUI + AI Pool</p>
              <a href="/api/health" class="btn btn-primary">API 健康檢查</a>
              <a href="/api/v1/ai/servers" class="btn btn-ghost">AI Server 列表</a>
            </div>
          </div>
        </div>
      </main>

      <footer class="footer footer-center bg-base-300 text-base-content p-6">
        <p>Powered by Deno & Hono</p>
      </footer>
    </body>
    </html>
  `);
});

// API 路由
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Pool 路由
app.all("/api/v1/ai/*", async (c) => {
  return 處理AI請求(c);
});

// ── 啟動 ──
async function main() {
  // 初始化 L1 資料庫
  await dataPool.initL1();

  // 啟動排程器
  await 定時器.排程({
    讀取所有排程: async () => {
      const result = await dataPool.listAll<排程記錄>("排程記錄");
      return (result.data ?? []).map((d) => new 排程記錄(d));
    },
    更新最後執行: async (id: string, time: Date) => {
      await dataPool.upsert("排程記錄", { id, 最後執行: time });
    },
    刪除排程: async (id: string) => {
      await dataPool.delete(id);
    },
  });

  Deno.serve({ port: 8000 }, app.fetch);
}

await main();
