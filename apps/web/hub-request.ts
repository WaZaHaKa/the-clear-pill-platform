/** Hebrew unless the visitor explicitly asks for English. */
export function documentIsHebrew(pathname: string, lang: string | null | undefined): boolean {
  if (
    pathname === "/today" ||
    pathname === "/plan" ||
    pathname.startsWith("/today/") ||
    pathname.startsWith("/plan/")
  ) {
    return true;
  }
  return lang !== "en";
}

/**
 * Sales and commercial sections render only when the server env is exactly
 * "true". Missing, empty, "false", and any other value stay off.
 */
export function isHubSalesEnabled(value?: string): boolean {
  const raw = arguments.length === 0 ? process.env.HUB_SALES_SECTIONS : value;
  return raw === "true";
}

export function hubLang(lang: string | undefined): "he" | "en" {
  return lang === "en" ? "en" : "he";
}
