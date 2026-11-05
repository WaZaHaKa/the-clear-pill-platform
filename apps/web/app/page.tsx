import type { Metadata } from "next";
import { hubLang, isHubSalesEnabled } from "../hub-request";
import { HubLanding } from "./hub-landing";

export const dynamic = "force-dynamic";

type SearchParams = { lang?: string | string[] };

function langParam(lang: string | string[] | undefined): string | undefined {
  return Array.isArray(lang) ? lang[0] : lang;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const he = hubLang(langParam(params.lang)) === "he";
  return {
    title: { absolute: "WZHK AC by The Clear Pill" },
    description: he
      ? "אתרים, משפכי לידים ואוטומציה שבנינו עבור עסקים אמיתיים."
      : "Sites, lead funnels and automation we built for real businesses.",
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return <HubLanding lang={hubLang(langParam(params.lang))} sales={isHubSalesEnabled()} />;
}
