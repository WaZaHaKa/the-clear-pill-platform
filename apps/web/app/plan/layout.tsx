import type { Metadata } from "next";
import { guardPrivatePage } from "../../private-page-guard";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  guardPrivatePage();
  return (
    <div lang="he" dir="rtl">
      {children}
    </div>
  );
}
