import * as cookie from "cookie";
import bcrypt from "bcryptjs";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import { Session } from "@contracts/constants";

type HeaderLike = {
  get(name: string): string | null;
  append(name: string, value: string): void;
};
import { Errors } from "@contracts/errors";
import { signSessionToken, verifySessionToken } from "./session";
import {
  createUser,
  findUserByEmail,
  findUserByUnionId,
} from "./queries/users";
import type { User } from "@db/schema";

export async function authenticateRequest(headers: HeaderLike) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    console.warn("[auth] No session cookie found in request.");
    throw Errors.forbidden("Invalid authentication token.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }
  return user;
}

export async function loginWithEmail(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser({
      email: normalizedEmail,
      unionId: normalizedEmail,
      name: normalizedEmail.split("@")[0],
      passwordHash,
      role: "user",
    });
    return newUser;
  }

  if (!user.passwordHash) {
    throw Errors.unauthorized("Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw Errors.unauthorized("Invalid email or password.");
  }

  return user;
}

export async function attachSessionCookie(headers: HeaderLike, user: User) {
  const token = await signSessionToken({
    unionId: user.unionId,
    clientId: env.appId || "local",
  });
  const cookieOpts = getSessionCookieOptions(headers);
  const cookieValue = cookie.serialize(Session.cookieName, token, {
    ...cookieOpts,
    maxAge: Session.maxAgeMs / 1000,
  });
  headers.append("set-cookie", cookieValue);
}

export async function verifyUserSession(token: string) {
  const claim = await verifySessionToken(token);
  if (!claim) return null;
  return findUserByUnionId(claim.unionId);
}
