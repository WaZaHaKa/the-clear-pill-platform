import { notFound } from "next/navigation";
import { privatePagesEnabled } from "./private-pages";

export function guardPrivatePage(): void {
  if (!privatePagesEnabled()) notFound();
}
