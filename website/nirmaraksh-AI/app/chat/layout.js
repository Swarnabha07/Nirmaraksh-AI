import { Orbitron, Rajdhani } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-orbitron",
  display: "swap",
});
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata = {
  title: "Chat — Nirmaraksh AI",
  robots: { index: false, follow: false },
};

export default function ChatRouteLayout({ children }) {
  return (
    <div className={`${orbitron.variable} ${rajdhani.variable}`}>
      {children}
    </div>
  );
}
