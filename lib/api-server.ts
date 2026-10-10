import "server-only";
import { NextResponse } from "next/server";
import { adminClient, sessionClient } from "./supabase-server";
import type { Role } from "./roles";

export type Profile = { id: string; email: string; display_name: string; roles: Role[]; active: boolean };
export type Ctx = { user: Profile; db: ReturnType<typeof adminClient>; params: Record<string, string> };

export class ApiError extends Error {
  constructor(public status: number, public code: string, public detail?: string) {
    super(code);
  }
}

/** Mã lỗi nghiệp vụ được coi là "thao tác bị chặn" → ghi audit result=BLOCKED (transaction riêng). */
const BLOCK_CODES = new Set([
  "DAY_LOCKED", "PARTY_BLOCKED", "SELLER_BLOCKED", "QTY_EXCEEDS_AVAILABLE", "SAME_PERSON",
  "OVER_DELIVERY", "RATE_LIMIT_4", "FORBIDDEN",
]);

export async function currentProfile(): Promise<Profile | null> {
  const supa = await sessionClient();
  const { data } = await supa.auth.getUser();
  if (!data.user) return null;
  const { data: prof } = await adminClient().from("app_users").select("*").eq("id", data.user.id).maybeSingle();
  if (!prof || !prof.active) return null;
  return prof as Profile;
}

type Handler = (req: Request, ctx: Ctx) => Promise<unknown>;

/**
 * Bọc mọi API route: kiểm tra đăng nhập, kiểm tra vai trò, dịch lỗi Postgres thành mã lỗi.
 * roles = undefined → mọi người đã đăng nhập; roles = [...] → phải có ít nhất 1 vai trò.
 */
export function route(handler: Handler, opts: { roles?: Role[]; action?: string } = {}) {
  return async (req: Request, context: { params: Promise<Record<string, string>> }) => {
    const params = (await context?.params) ?? {};
    let user: Profile | null = null;
    try {
      user = await currentProfile();
      if (!user) throw new ApiError(401, "UNAUTHORIZED");
      if (opts.roles && !opts.roles.some((r) => user!.roles.includes(r))) {
        throw new ApiError(403, "FORBIDDEN", opts.roles.join(","));
      }
      const result = await handler(req, { user, db: adminClient(), params });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (e) {
      const err = toApiError(e);
      if (user && BLOCK_CODES.has(err.code)) {
        await adminClient().rpc("write_audit", {
          p_actor: user.id,
          p_action: opts.action ?? `${req.method} ${new URL(req.url).pathname}`,
          p_entity: "api",
          p_entity_id: params.id ?? null,
          p_before: null,
          p_after: null,
          p_reason: `${err.code}${err.detail ? ": " + err.detail : ""}`,
          p_result: "BLOCKED",
        });
      }
      if (err.status >= 500) console.error(e);
      return NextResponse.json({ error: err.code, detail: err.detail ?? null }, { status: err.status });
    }
  };
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  const msg = (e as { message?: string })?.message ?? String(e);
  // Lỗi từ RAISE EXCEPTION 'CODE: detail'
  const m = msg.match(/^([A-Z][A-Z0-9_]+)(?::\s*(.*))?$/);
  if (m) return new ApiError(400, m[1], m[2]);
  if (msg.includes("duplicate key")) return new ApiError(409, "DUPLICATE", msg);
  if (msg.includes("violates check constraint")) return new ApiError(400, "CHECK_VIOLATION", msg);
  if (msg.includes("QUAL_TYPE_MISMATCH")) return new ApiError(400, "QUAL_TYPE_MISMATCH", msg);
  return new ApiError(500, "SERVER_ERROR", msg);
}

/** Ném lỗi nếu Supabase trả lỗi, trả về data. */
export function must<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw toApiError(res.error);
  return res.data;
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "BAD_JSON");
  }
}

export function str(v: unknown, field: string, required = true): string | null {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
  if (!s) {
    if (required) throw new ApiError(400, "REQUIRED", field);
    return null;
  }
  return s;
}

export function num(v: unknown, field: string, opts: { min?: number; required?: boolean } = {}): number | null {
  if (v === "" || v == null) {
    if (opts.required === false) return null;
    throw new ApiError(400, "REQUIRED", field);
  }
  const n = Number(v);
  if (!Number.isFinite(n)) throw new ApiError(400, "NOT_NUMBER", field);
  if (opts.min !== undefined && n < opts.min) throw new ApiError(400, "OUT_OF_RANGE", field);
  return n;
}

export function date(v: unknown, field: string, required = true): string | null {
  const s = str(v, field, required);
  if (s && !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ApiError(400, "BAD_DATE", field);
  return s;
}

export function csv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = "﻿" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  return new Response(text, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export function jstToday(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
