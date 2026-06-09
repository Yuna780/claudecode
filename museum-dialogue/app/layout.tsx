import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/Header";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Museum Dialogue",
  description: "展覧会の感想をシェアして、対話しよう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
