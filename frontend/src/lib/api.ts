const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean>;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, body, ...rest } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => search.append(key, String(value)));
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const isFormData = body instanceof FormData;
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(headers as Record<string, string>),
    },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data && typeof data === "object") {
        if (typeof data.detail === "string") message = data.detail;
        else if (typeof data.message === "string") message = data.message;
        else if (typeof data.error === "string") message = data.error;
      }
    } catch {
      // ignore JSON parse errors
    }
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
};

export default api;
