import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { MembersProvider } from "@/lib/MembersProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Toastmasters Dashboard",
  description: "VP Education dashboard for meeting tracking, speaker requests, and role-player tools.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen flex-col bg-slate-50 text-slate-900 md:flex-row">
        <MembersProvider>
          <Sidebar />
          <div className="relative flex min-w-0 flex-1 flex-col">
            <MobileNav />
            <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
          </div>
        </MembersProvider>
      </body>
    </html>
  );
}
