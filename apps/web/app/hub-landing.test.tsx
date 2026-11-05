import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { HubLanding } from "./hub-landing";
import { documentIsHebrew, hubLang, isHubSalesEnabled } from "../hub-request";

const salesMarkers = [
  'data-section="sales-build"',
  'data-section="sales-how"',
  'data-section="sales-terms"',
  'data-section="sales-pricing"',
  'data-section="sales-faq"',
  'data-section="sales-cta"',
  'data-section="sales-hero-cta"',
  "רוצים לשמוע איך זה יעבוד אצלכם? דברו איתנו",
  "Want to hear how this would work for you? Talk to us.",
  "14-day money-back guarantee from go-live.",
  "money-back",
  "החזר כספי תוך 14 יום מעלייה לאוויר.",
  "החזר",
  "No free trial.",
  "אין ניסיון חינם.",
  "[Tony final v16 wording]",
  "[ניסוח סופי של טוני, גרסה 16]",
  "[No price list in the plan]",
  "[מחירים אינם בתוכנית]",
];

const originalSales = process.env.HUB_SALES_SECTIONS;

afterEach(() => {
  if (originalSales === undefined) delete process.env.HUB_SALES_SECTIONS;
  else process.env.HUB_SALES_SECTIONS = originalSales;
});

function htmlFor(env: string | undefined, lang: "he" | "en") {
  if (env === undefined) delete process.env.HUB_SALES_SECTIONS;
  else process.env.HUB_SALES_SECTIONS = env;
  return renderToStaticMarkup(<HubLanding lang={lang} sales={isHubSalesEnabled()} />);
}

describe("hub sales sections stay off unless the flag is exactly true", () => {
  it("does not render sales sections when the flag is unset", () => {
    delete process.env.HUB_SALES_SECTIONS;
    expect(isHubSalesEnabled()).toBe(false);
    const html = htmlFor(undefined, "he");
    for (const marker of salesMarkers) expect(html).not.toContain(marker);
    expect(html).toContain('data-section="hero"');
    expect(html).toContain('data-section="portfolio"');
    expect(html).toContain('data-section="support"');
    expect(html).toContain("Coming soon");
    expect(html).toContain('aria-disabled="true"');
    expect(html.match(/class="portfolioLabel">שלנו</g)).toHaveLength(2);
    expect(html).not.toContain("עסק משפחתי");
    expect(html).not.toContain("Family business");
    expect(html).not.toContain("של משפחה");
    expect(html).toContain('dir="rtl"');
  });

  it("does not render sales sections when the flag is false", () => {
    process.env.HUB_SALES_SECTIONS = "false";
    expect(isHubSalesEnabled()).toBe(false);
    const html = htmlFor("false", "en");
    for (const marker of salesMarkers) expect(html).not.toContain(marker);
    expect(html.match(/class="portfolioLabel">Own</g)).toHaveLength(2);
    expect(html).not.toContain("Family business");
    expect(html).not.toContain("עסק משפחתי");
    expect(html).not.toContain("a family's");
    expect(html).toContain("Coming soon");
    expect(html).toContain('dir="ltr"');
    expect(html).not.toContain('data-section="sales-hero-cta"');
  });

  it("fails closed for empty and unexpected values", () => {
    expect(isHubSalesEnabled("")).toBe(false);
    expect(isHubSalesEnabled("1")).toBe(false);
    expect(isHubSalesEnabled("TRUE")).toBe(false);
    expect(isHubSalesEnabled("yes")).toBe(false);
    expect(isHubSalesEnabled("false")).toBe(false);
  });

  it("renders the sales sections only when the flag is true, without refund terms", () => {
    const html = htmlFor("true", "he");
    expect(isHubSalesEnabled("true")).toBe(true);
    expect(html).not.toContain("החזר");
    expect(html).not.toContain("14-day");
    expect(html).not.toContain("money-back");
    expect(html).toContain("[ניסוח סופי של טוני, גרסה 16]");
    expect(html).toContain("אין ניסיון חינם.");
    const english = htmlFor("true", "en");
    expect(english).not.toContain("14-day");
    expect(english).not.toContain("money-back");
    expect(english).not.toContain("refund");
    expect(english).toContain("[Tony final v16 wording]");
    expect(english).toContain("No free trial.");
    for (const marker of [
      "sales-build",
      "sales-how",
      "sales-terms",
      "sales-pricing",
      "sales-faq",
      "sales-cta",
      "sales-hero-cta",
    ]) {
      expect(html).toContain(`data-section="${marker}"`);
    }
  });
});

describe("public hub links and exclusions", () => {
  it("uses plain portfolio links and keeps the planner and other assets off the page", () => {
    const html = htmlFor(undefined, "he");
    const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
    for (const href of hrefs) expect(href.toLowerCase()).not.toContain("utm_");
    for (const url of ["https://minimal-il.com", "https://atelierelenadolls.com", "https://ae-dolls.com"]) {
      expect(hrefs).toContain(url);
      const tag = html.match(new RegExp(`<a[^>]*href="${url}"[^>]*>`));
      expect(tag?.[0]).toContain('rel="noopener noreferrer"');
    }
    expect(html).not.toContain("/today");
    expect(html).not.toContain("/plan");
    for (const hidden of ["bogatyr", "pupcalm", "hayaleflowers", "wzhkmedia", "trackprompt", "paypal", "תרומה"]) {
      expect(html.toLowerCase()).not.toContain(hidden.toLowerCase());
    }
  });

  it("treats Hebrew as the default language", () => {
    expect(hubLang(undefined)).toBe("he");
    expect(hubLang("he")).toBe("he");
    expect(hubLang("en")).toBe("en");
    expect(documentIsHebrew("/", null)).toBe(true);
    expect(documentIsHebrew("/", "en")).toBe(false);
    expect(documentIsHebrew("/today", "en")).toBe(true);
    expect(documentIsHebrew("/plan", null)).toBe(true);
  });
});
