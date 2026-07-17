import type { HonoRequest } from "hono";
import * as jose from "jose";
import { env } from "./lib/env";
import { createUser, upsertUser } from "./queries/users";
import { attachSessionCookie } from "./auth";

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function getAppleAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: env.appleClientId,
    redirect_uri: "http://localhost:3000/api/auth/apple/callback",
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "name email",
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

export async function handleAppleCallback(req: HonoRequest) {
  const contentType = req.header("content-type") || "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return new Response("Invalid content type", { status: 400 });
  }

  const form = await (req as any).parseBody();
  const body = form as Record<string, string>;
  const code = body.code;
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const clientSecret = await new jose.SignJWT({
    iss: env.appleTeamId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 5,
    aud: "https://appleid.apple.com",
    sub: env.appleClientId,
  })
    .setProtectedHeader({ alg: "ES256", kid: env.appleKeyId })
    .sign(await jose.importPKCS8(env.applePrivateKey, "ES256"));

  const tokenResp = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: env.appleClientId,
      client_secret: clientSecret as any,
      redirect_uri: "http://localhost:3000/api/auth/apple/callback",
    }),
  });

  const tokenJson: any = await tokenResp.json();
  const idToken = tokenJson.id_token;
  if (!idToken) {
    return new Response("Failed to get ID token", { status: 400 });
  }
  // decode without verification for initial local testing
  const payload: any = jose.decodeJwt(idToken);
  const email = payload?.email as string;
  const sub = payload?.sub as string;
  if (!email || !sub) {
    return new Response("Missing Apple user data", { status: 400 });
  }

  const user = await upsertUser({
    unionId: `apple:${sub}`,
    email,
    name: email.split("@")[0],
    role: "user",
  });
  const headers = new Headers();
  await attachSessionCookie(headers as any, user as any);
  headers.set("Location", "/");
  return new Response(null, { status: 302, headers });
}
