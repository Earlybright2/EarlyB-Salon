import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { getGoogleAuthorizeUrl, handleGoogleCallback } from "./auth-google";
import { getAppleAuthorizeUrl, handleAppleCallback } from "./auth-apple";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.get("/api/auth/google", (c) => {
  if (!env.googleClientId || !env.googleClientSecret) {
    return c.text("Google OAuth is not configured.", 500);
  }
  return c.redirect(getGoogleAuthorizeUrl());
});

app.get("/api/auth/google/callback", async (c) => {
  return handleGoogleCallback(c.req);
});

app.get("/api/auth/apple", (c) => {
  if (!env.appleClientId || !env.appleTeamId || !env.appleKeyId || !env.applePrivateKey) {
    return c.text("Apple OAuth is not configured.", 500);
  }
  return c.redirect(getAppleAuthorizeUrl());
});

app.post("/api/auth/apple/callback", async (c) => {
  return handleAppleCallback(c.req);
});

// Temporary test endpoint for end-to-end email/password login/signup
app.post("/api/test/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body as { email?: string; password?: string };
    if (!email || !password) return c.json({ error: "email and password required" }, 400);
    // Lazy create or login
    const { loginWithEmail } = await import("./auth");
    const user = await loginWithEmail(email, password);
    const headers = new Headers();
    const { attachSessionCookie } = await import("./auth");
    await attachSessionCookie(headers as any, user as any);
    const res = c.json(user);
    // forward set-cookie header
    const setCookie = headers.get("set-cookie");
    if (setCookie) res.headers.append("set-cookie", setCookie);
    return res;
  } catch (err: any) {
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
