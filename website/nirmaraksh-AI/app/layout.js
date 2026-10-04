import { DM_Sans, Space_Grotesk } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import DemoProvider from "@/components/ui/DemoProvider";
import { site } from "@/data/site";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

export const metadata = {
  title: site.title,
  description: site.description,
  robots: site.indexable ? undefined : { index: false, follow: false },
};

export const viewport = {
  themeColor: "#07111f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <DemoProvider>
          <AuthProvider>{children}</AuthProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
