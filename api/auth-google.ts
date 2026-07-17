import { env } from "./lib/env";
import type { HonoRequest } from "hono";
import * as jose from "jose";
import { createUser, upsertUser } from "./queries/users";
import { attachSessionCookie } from "./auth";
import { Session } from "@contracts/constants";

const googleEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleUserInfo = "https://www.googleapis.com/oauth2/v3/userinfo";

export function getGoogleAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: "http://localhost:3000/api/auth/google/callback",
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    access_type: "offline",
  });

  return `${googleEndpoint}?${params.toString()}`;
}

export async function handleGoogleCallback(req: HonoRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenResp = await fetch(googleTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: "http://localhost:3000/api/auth/google/callback",
      grant_type: "authorization_code",
    }),
  });

  const tokenJson: any = await tokenResp.json();
  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    return new Response("Failed to obtain Google access token", { status: 400 });
  }

  const userResp = await fetch(googleUserInfo, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile: any = await userResp.json();
  if (!profile?.email) {
    return new Response("Google profile missing email", { status: 400 });
  }

  const user = await upsertUser({
    unionId: `google:${profile.sub}`,
    email: profile.email,
    name: profile.name ?? profile.email,
    avatar: profile.picture ?? null,
    role: "user",
  });

  const headers = new Headers();
  await attachSessionCookie(headers as any, user as any);
  headers.set("Location", "/");
  return new Response(null, { status: 302, headers });
}
