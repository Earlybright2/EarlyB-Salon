import type { SerializeOptions } from "cookie";

type HeaderLike = { get(name: string): string | null };

function isLocalhost(headers: HeaderLike): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function getSessionCookieOptions(headers: HeaderLike): SerializeOptions {
  const localhost = isLocalhost(headers);

  return {
    httpOnly: true,
    path: "/",
    sameSite: localhost ? "lax" : "none",
    secure: !localhost,
  };
}
