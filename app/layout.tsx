import "./globals.css";
import { cookies } from "next/headers";
import { LangProvider, type Lang } from "@/lib/i18n";

export const metadata = {
  title: "桜水産市場 業務支援システム (Prototype)",
  description: "LAB-2 prototype — Product A",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const lang: Lang = c.get("lang")?.value === "vi" ? "vi" : "ja";
  return (
    <html lang={lang}>
      <body>
        <LangProvider initial={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
