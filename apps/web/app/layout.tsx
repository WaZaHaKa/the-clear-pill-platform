import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";

export const metadata: Metadata = {
  title: "The Clear Pill",
  description: "מערכת תכנון שמחברת חזון לפעולה יומית",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/today" aria-label="The Clear Pill — היום">
              <span className="brandMark" aria-hidden="true">●</span>
              <span>The Clear Pill</span>
            </Link>
            <nav aria-label="ניווט ראשי">
              <Link href="/today">היום</Link>
              <Link href="/plan">התכנית</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
