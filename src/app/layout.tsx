import type { Metadata } from "next";
import { Crimson_Pro, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

const bodyFont = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Crimson_Pro({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudentReach",
  description:
    "StudentReach helps high school students find professors, understand what they do, and write better cold emails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
