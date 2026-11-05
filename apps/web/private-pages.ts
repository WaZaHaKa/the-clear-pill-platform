/** Planner routes stay closed unless the server env is exactly "true". */
export function privatePagesEnabled(value?: string): boolean {
  const raw = arguments.length === 0 ? process.env.PRIVATE_PAGES_ENABLED : value;
  return raw === "true";
}

export function isPrivatePlannerPath(pathname: string): boolean {
  return (
    pathname === "/today" ||
    pathname === "/plan" ||
    pathname.startsWith("/today/") ||
    pathname.startsWith("/plan/")
  );
}

