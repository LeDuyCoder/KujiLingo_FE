import type { Metadata } from "next";
import { Noto_Sans, M_PLUS_1p, Be_Vietnam_Pro } from "next/font/google";
import "../shared/styles/globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const mPlus1p = M_PLUS_1p({
  variable: "--font-m-plus-1p",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "KujiLingo | Học tiếng Nhật thông minh",
    template: "%s | KujiLingo",
  },
  description: "Ứng dụng học tiếng Nhật hiệu quả với lộ trình cá nhân hóa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${mPlus1p.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
