import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap" 
});

export const metadata: Metadata = {
  title: "LifeBridge AI - Intelligent Disaster Response & Emergency Assistant",
  description: "A premium AI-powered multi-agent disaster response platform coordinating emergency requests, shelters, hospital status, and volunteer rescue paths.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
