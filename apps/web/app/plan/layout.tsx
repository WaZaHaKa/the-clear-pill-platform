import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="he" dir="rtl">
      {children}
    </div>
  );
}
