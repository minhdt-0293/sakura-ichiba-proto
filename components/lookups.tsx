"use client";
import { useCallback } from "react";
import { useApi } from "@/lib/api-client";
import { useLang } from "@/lib/i18n";

export type PartyLite = { id: string; code: string; name: string; kind: string; status: string };
type MasterRow = { category: string; code: string; name_ja: string; name_vi: string; sort: number };

export function useLookups() {
  const { data } = useApi<{ parties: PartyLite[]; masters: MasterRow[] }>("/api/lookups");
  const { lang } = useLang();
  const masters = useCallback(
    (cat: string) => (data?.masters ?? []).filter((m) => m.category === cat).map((m) => ({ code: m.code, label: lang === "ja" ? m.name_ja : m.name_vi })),
    [data, lang]
  );
  const mname = useCallback(
    (cat: string, code: string | null | undefined) => {
      if (!code) return "";
      const m = data?.masters.find((x) => x.category === cat && x.code === code);
      return m ? (lang === "ja" ? m.name_ja : m.name_vi) : code;
    },
    [data, lang]
  );
  return { ready: !!data, parties: data?.parties ?? [], masters, mname };
}
