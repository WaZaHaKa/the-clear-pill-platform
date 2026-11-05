import { redirect } from "next/navigation";

type SearchParams = { lang?: string | string[] };

export default async function SupportAliasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<never> {
  const params = await searchParams;
  const lang = Array.isArray(params.lang) ? params.lang[0] : params.lang;
  redirect(lang === "en" ? "/?lang=en" : "/");
}
