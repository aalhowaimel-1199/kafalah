const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export type ApiError = { error?: string; issues?: Record<string, string[]> };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error((data as ApiError).error || "خطأ في الطلب"), { data, status: res.status });
  }
  return data as T;
}

const body = (b?: unknown) => JSON.stringify(b ?? {});

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, b?: unknown) => request<T>(p, { method: "POST", body: body(b) }),
  put: <T>(p: string, b?: unknown) => request<T>(p, { method: "PUT", body: body(b) }),
  patch: <T>(p: string, b?: unknown) => request<T>(p, { method: "PATCH", body: body(b) }),
  del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
};

export { API_URL };
