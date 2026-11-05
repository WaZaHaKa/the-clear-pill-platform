import type { Metadata } from "next";

// Showcase only: no payment control. Processor, refund-window, receipt, and
// identity-threshold sentences from the wording are omitted. Their unfilled
// brackets are not rendered.

type SearchParams = { lang?: string | string[] };

function isHebrew(lang: string | string[] | undefined): boolean {
  const value = Array.isArray(lang) ? lang[0] : lang;
  return value === "he";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const he = isHebrew(params.lang);
  const title = he ? "תמיכה ב-WZHK מאת TSNO" : "Support WZHK by TSNO";
  return {
    title: { absolute: title },
    description: he
      ? "כל התוכן ב-WZHK חינמי, והוא יישאר חינמי בין אם תתמכו ובין אם לא."
      : "Everything on WZHK is free, and it stays free whether or not you give.",
    openGraph: { title },
    twitter: { title },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const he = isHebrew(params.lang);

  return (
    <article className="supportLanding" lang={he ? "he" : "en"} dir={he ? "rtl" : "ltr"}>
      <nav className="langSwitch" dir="ltr" aria-label={he ? "שפה" : "Language"}>
        <a href="/" hrefLang="en" lang="en" aria-current={he ? undefined : "page"}>
          English
        </a>
        <a href="/?lang=he" hrefLang="he" lang="he" aria-current={he ? "page" : undefined}>
          עברית
        </a>
      </nav>
      {he ? <HebrewSupport /> : <EnglishSupport />}
    </article>
  );
}

function ComingSoon({ he }: { he: boolean }) {
  return (
    <button type="button" className="supportCta" disabled aria-disabled="true">
      <span lang={he ? "he" : "en"} dir={he ? "rtl" : "ltr"}>
        {he ? "בקרוב" : "Coming soon"}
      </span>
    </button>
  );
}

function EnglishSupport() {
  return (
    <>
      <h1>Support WZHK by TSNO</h1>
      <p className="lede">Everything on WZHK is free, and it stays free whether or not you give.</p>
      <p>If you&apos;d like to support the work, you can send a voluntary gift.</p>
      <section className="panel supportPanel">
        <h2>Please read before you give:</h2>
        <ul className="supportList">
          <li>
            Your gift goes to <strong>Albert Shovtyuk</strong>, the creator of WZHK, personally. TSNO is
            the name of Albert&apos;s personal project, not a company or a registered organisation.
          </li>
          <li>
            A gift <strong>doesn&apos;t buy anything</strong>: no service, content, perks, priority or access.
            Nothing on WZHK depends on whether you give.
          </li>
        </ul>
        <ComingSoon he={false} />
        <p className="supportThanks">Thank you.</p>
      </section>
    </>
  );
}

function HebrewSupport() {
  return (
    <>
      <h1 className="supportTitleEn" lang="en" dir="ltr">
        Support WZHK by TSNO
      </h1>
      <p className="supportSubtitle">תמיכה ב-WZHK</p>
      <p className="lede">כל התוכן ב-WZHK חינמי, והוא יישאר חינמי בין אם תתמכו ובין אם לא.</p>
      <p>אם תרצו לתמוך בעבודה, אפשר לשלוח מתנה מרצון.</p>
      <section className="panel supportPanel">
        <h2>חשוב לקרוא לפני שנותנים:</h2>
        <ul className="supportList">
          <li>
            המתנה שלכם מגיעה ל<strong>אלברט שובטיוק</strong>, היוצר של WZHK, באופן אישי. TSNO הוא שם
            הפרויקט האישי של אלברט, ואינו חברה או ארגון רשום.
          </li>
          <li>
            המתנה <strong>אינה רוכשת דבר</strong>: לא שירות, לא תוכן, לא הטבות, לא עדיפות ולא גישה. שום
            דבר ב-WZHK אינו תלוי בכך שתתמכו.
          </li>
        </ul>
        <ComingSoon he />
        <p className="supportThanks">תודה.</p>
      </section>
    </>
  );
}
