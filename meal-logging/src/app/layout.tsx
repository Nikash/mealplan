import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import { AppDataProvider } from "@/context/AppDataContext";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meal Log",
  description: "Simple family meal logging",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AppDataProvider>
          <main className="shell">{children}</main>
        </AppDataProvider>
      </body>
    </html>
  );
}
