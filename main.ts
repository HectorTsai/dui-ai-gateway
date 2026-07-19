import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";

const app = new Hono();

// 靜態檔案服務（以 Deno 原生 fs 取代 Node.js 實作）
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
              <p class="py-6 text-lg">Deno + Hono + TailwindCSS + DaisyUI</p>
              <button class="btn btn-primary">Get Started</button>
              <button class="btn btn-ghost">Learn More</button>
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

// API 路由範例
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

Deno.serve({ port: 8000 }, app.fetch);
