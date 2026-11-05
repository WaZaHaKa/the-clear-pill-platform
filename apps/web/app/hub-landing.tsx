import { EnglishSupport, HebrewSupport } from "./support-block";

export type HubLang = "he" | "en";

const portfolioSubhead = {
  he: "אתרים, משפכי לידים ואוטומציה שבנינו עבור עסקים אמיתיים. ליד כל פרויקט כתוב אם הוא שלנו, של משפחה או של לקוח.",
  en: "Sites, lead funnels and automation we built for real businesses. Next to each project it says whether it is ours, a family's, or a client's.",
} as const;

const salesCta = {
  he: "רוצים לשמוע איך זה יעבוד אצלכם? דברו איתנו",
  en: "Want to hear how this would work for you? Talk to us.",
} as const;

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} rel="noopener" target="_blank">
      {children}
    </a>
  );
}

export function HubLanding({ lang, sales }: { lang: HubLang; sales: boolean }) {
  const he = lang === "he";

  return (
    <article className="hub" lang={lang} dir={he ? "rtl" : "ltr"}>
      <nav className="langSwitch" dir="ltr" aria-label={he ? "שפה" : "Language"}>
        <a href="/" hrefLang="he" lang="he" aria-current={he ? "page" : undefined}>
          עברית
        </a>
        <a href="/?lang=en" hrefLang="en" lang="en" aria-current={he ? undefined : "page"}>
          English
        </a>
      </nav>

      <section className="hubHero" data-section="hero">
        <h1>WZHK AC by The Clear Pill</h1>
        <p className="lede">
          {he ? "כלי ושירות שנבנים עבורכם, ולא קורס." : "A tool and service built for you, never a course."}
        </p>
        <p>
          {he
            ? "למשווקים דיגיטליים ולמשרדים בישראל, ולמתווכים."
            : "For Israeli digital marketers and agencies, and for brokers."}
        </p>
        {sales ? (
          <p data-section="sales-hero-cta">
            <a href="#contact">{salesCta[lang]}</a>
          </p>
        ) : null}
      </section>

      {sales ? (
        <section className="panel" data-section="sales-build">
          <h2>{he ? "מה אנחנו בונים" : "What we build"}</h2>
          <ul className="salesList">
            <li>{he ? "אתרים" : "Sites"}</li>
            <li>{he ? "משפכי לידים" : "Funnels"}</li>
            <li>{he ? "איסוף לידים" : "Lead capture"}</li>
            <li>{he ? "אוטומציה" : "Automation"}</li>
          </ul>
        </section>
      ) : null}

      {sales ? (
        <section className="panel" data-section="sales-how">
          <h2>{he ? "איך זה עובד" : "How it works"}</h2>
          <ol className="salesList">
            <li>{he ? "שיחה" : "Call"}</li>
            <li>{he ? "בנייה" : "Build"}</li>
            <li>{he ? "עלייה לאוויר שמאושרת בכתב" : "Go-live confirmed in writing"}</li>
          </ol>
        </section>
      ) : null}

      <section className="hubPortfolio" data-section="portfolio" aria-labelledby="portfolio-heading">
        <h2 id="portfolio-heading">{he ? "עבודות שבנינו" : "Work we built"}</h2>
        <p>{portfolioSubhead[lang]}</p>
        <div className="portfolioGrid">
          <article className="panel portfolioCard">
            <h3>MINIMAL IL</h3>
            <p className="portfolioLabel">{he ? "שלנו" : "Own"}</p>
            <p>{he ? "אתר קהילה עם הצטרפות לקבוצת WhatsApp." : "Community site with a WhatsApp group sign-up."}</p>
            <p className="portfolioLinks">
              <ExternalLink href="https://minimal-il.com">minimal-il.com</ExternalLink>
            </p>
          </article>
          <article className="panel portfolioCard">
            <h3>ATELIER ELENA</h3>
            <p className="portfolioLabel">{he ? "עסק משפחתי" : "Family business"}</p>
            <p>
              {he
                ? "אתר מותג ובובות בעבודת יד, עברית ואנגלית. (עסק משפחתי)"
                : "Handmade-doll brand site, Hebrew and English. (Family business)"}
            </p>
            <p className="portfolioLinks">
              <ExternalLink href="https://atelierelenadolls.com">atelierelenadolls.com</ExternalLink>
              <ExternalLink href="https://ae-dolls.com">ae-dolls.com</ExternalLink>
            </p>
          </article>
        </div>
      </section>

      {sales ? (
        <section className="panel" data-section="sales-terms">
          <h2>{he ? "תנאים בקצרה" : "Terms in brief"}</h2>
          <p>{he ? "החזר כספי תוך 14 יום מעלייה לאוויר." : "14-day money-back guarantee from go-live."}</p>
          <p>{he ? "אין ניסיון חינם." : "No free trial."}</p>
          <p className="placeholder">{he ? "[ניסוח סופי של טוני, גרסה 16]" : "[Tony final v16 wording]"}</p>
        </section>
      ) : null}

      {sales ? (
        <section className="panel" data-section="sales-pricing">
          <h2>{he ? "מחירים" : "Pricing"}</h2>
          <p className="placeholder">{he ? "[מחירים אינם בתוכנית]" : "[No price list in the plan]"}</p>
        </section>
      ) : null}

      {sales ? (
        <section className="panel" data-section="sales-faq">
          <h2>FAQ</h2>
          <ul className="salesList">
            <li>{he ? "זה לא קורס." : "It is not a course."}</li>
            <li>{he ? "[מי הבעלים של האתר — אין ניסוח בתוכנית]" : "[Who owns the site — wording not in the plan]"}</li>
            <li>{he ? "[פרטיות — אין ניסוח בתוכנית]" : "[Privacy — wording not in the plan]"}</li>
          </ul>
        </section>
      ) : null}

      {sales ? (
        <section className="panel" id="contact" data-section="sales-cta">
          <h2>{he ? "יצירת קשר" : "Contact"}</h2>
          <p>{salesCta[lang]}</p>
        </section>
      ) : null}

      <section id="support" className="supportShowcase" data-section="support" aria-labelledby="support-heading">
        <div className="supportLanding">
          {he ? <HebrewSupport /> : <EnglishSupport />}
        </div>
      </section>

      <footer className="hubFooter" data-section="footer">
        <p>{he ? "נבנה על ידי The Clear Pill" : "Built by The Clear Pill"}</p>
        <p>
          <a href="#support">{he ? "Support WZHK by TSNO – תמיכה ב-WZHK" : "Support WZHK by TSNO"}</a>
        </p>
      </footer>
    </article>
  );
}
