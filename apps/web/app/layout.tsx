import type { Metadata } from "next";
import { headers } from "next/headers";
import "./styles.css";

export const metadata: Metadata = {
  title: "The Clear Pill",
  description: "מערכת תכנון שמחברת חזון לפעולה יומית",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const he = headerStore.get("x-clearpill-lang") === "he";

  return (
    <html lang={he ? "he" : "en"} dir={he ? "rtl" : "ltr"}>
      <body>
        <div className="shell">
          <header className="topbar">
            <a className="brand" href="/">
              <span className="brandMark" aria-hidden="true">●</span>
              <span>The Clear Pill</span>
            </a>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
