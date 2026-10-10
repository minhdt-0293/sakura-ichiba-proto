"use client";
import { useT } from "@/lib/i18n";
import { Table, Badge, dt } from "./ui";

function Diff({ before, after }: { before: any; after: any }) {
  if (!before && !after) return null;
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]))
    .filter((k) => !["updated_at", "created_at", "id"].includes(k))
    .filter((k) => !before || JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]));
  const show = (v: unknown) => (v == null ? "∅" : typeof v === "object" ? JSON.stringify(v) : String(v));
  return (
    <div className="mono small">
      {keys.slice(0, 8).map((k) => (
        <div key={k}>
          <b>{k}</b>: {before ? <><span style={{ color: "#c0392b" }}>{show(before?.[k])}</span> → </> : null}
          <span style={{ color: "#1e7f4f" }}>{show(after?.[k])}</span>
        </div>
      ))}
      {keys.length > 8 && <div className="muted">… +{keys.length - 8}</div>}
    </div>
  );
}

export function AuditTable({ rows }: { rows: any[] }) {
  const t = useT();
  return (
    <Table head={[t("日時", "Thời điểm"), t("実施者", "Người thực hiện"), t("操作", "Thao tác"), t("対象", "Đối tượng"), t("結果", "Kết quả"), t("変更前 → 変更後", "Trước → sau"), t("理由", "Lý do")]} empty={!rows.length}>
      {rows.map((r) => (
        <tr key={r.id}>
          <td className="nowrap small">{dt(r.at)}</td>
          <td className="small">{r.actor_name}</td>
          <td className="mono small">{r.action}</td>
          <td className="mono small">{r.entity}{r.entity_id ? ` / ${String(r.entity_id).slice(0, 13)}` : ""}</td>
          <td><Badge group="auditResult" value={r.result} /></td>
          <td style={{ maxWidth: 420 }}><Diff before={r.before} after={r.after} /></td>
          <td className="small">{r.reason}</td>
        </tr>
      ))}
    </Table>
  );
}
