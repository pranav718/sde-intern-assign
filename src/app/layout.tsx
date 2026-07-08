import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure Contract Portal",
  description: "Mock Setu Aadhaar eSign Sandbox Integration Assignment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col">
        
        {/* Navigation Bar (Shadcn + Aceternity UI inspiration) */}
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 outline-none">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 shadow-md shadow-violet-600/30 text-white font-bold text-base">
                S
              </div>
              <span className="text-sm font-bold tracking-tight text-zinc-100">
                SignFlow
              </span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-6">
              <Link 
                href="/" 
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Upload Document
              </Link>
              <Link 
                href="/status" 
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Document Statuses
              </Link>
            </nav>

            {/* Right side badge */}
            <div className="hidden sm:flex items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                Simulator Env
              </span>
            </div>

          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-6">
          <div className="container mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} SignFlow. Built for the SDE Internship Assessment.
            </p>
            <p className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800">
              Persisted with local SQLite database
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}
