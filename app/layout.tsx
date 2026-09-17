import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "SRIWANNA · ระบบเก็บยอดขาย",
  description: "บันทึกและสรุปยอดขายรายวัน พร้อมกราฟภาพรวม",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${notoThai.variable} h-full overflow-x-hidden antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[#faf4e9] font-[family-name:var(--font-noto-thai)] text-slate-900 dark:bg-[#340818] dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
