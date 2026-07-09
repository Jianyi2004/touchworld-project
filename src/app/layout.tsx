import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./figure-one.css";

const sourceSerif = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-source-serif",
});

const jetBrainsMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-code",
});

const siteBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/touchworld-project";
const faviconPath = `${siteBasePath}/touchworld/logos/phanes_logo.png`;

export const metadata: Metadata = {
  title: "TouchWorld: A Predictive and Reactive Tactile Foundation Model",
  description:
    "Project page for TouchWorld, a predictive and reactive tactile foundation model for dexterous manipulation.",
  icons: {
    icon: faviconPath,
    shortcut: faviconPath,
    apple: faviconPath,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${jetBrainsMono.variable} h-full antialiased`}>
      <body className={`${sourceSerif.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
