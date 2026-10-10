"use client";
import { useCallback, useEffect, useState } from "react";

export class ClientApiError extends Error {
  constructor(public status: number, public code: string, public detail: string | null) {
    super(code);
  }
}

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ClientApiError(res.status, data.error ?? "SERVER_ERROR", data.detail ?? null);
  return data as T;
}

export function useApi<T = unknown>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ClientApiError | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((x) => x + 1), []);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    setLoading(true);
    api<T>(url)
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [url, tick]);
  return { data, error, loading, reload };
}
