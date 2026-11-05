import type { Metadata } from "next";
import { headers } from "next/headers";
import "./styles.css";

const siteDescription = {
  en: "WZHK by TSNO — a personal project by Albert Shovtyuk.",
  he: "WZHK by TSNO — פרויקט אישי של אלברט שובטיוק.",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const he = headerStore.get("x-clearpill-lang") === "he";
  return {
    title: "The Clear Pill",
    description: he ? siteDescription.he : siteDescription.en,
  };
}

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
