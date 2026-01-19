import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Situation Monitor",
  description: "Real-time Intelligence Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} bg-[#050505] text-[#EDEDED] antialiased`}>
        {/* Cinematic Grid Background */}
        <div className="fixed inset-0 z-[-1] opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#333 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        {children}
      </body>
    </html>
  );
}
