import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SignFlow — Aadhaar eSign Portal",
  description: "Secure eSign and contract flow portal with Setu Aadhaar simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable}`}>
      <body className="min-h-screen text-black flex flex-col selection:bg-yellow-300 selection:text-black">
        
        {/* Navigation Bar (Neo-Brutalist Theme) */}
        <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white py-3 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
          <div className="container mx-auto flex max-w-6xl items-center justify-between px-6">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 outline-none group">
              <div className="flex h-10 w-10 items-center justify-center rounded-none border-2 border-black bg-[#A78BFA] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-black text-xl group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-100">
                S
              </div>
              <span className="text-base font-black tracking-tight text-black uppercase">
                SignFlow
              </span>
            </Link>

            {/* Nav Links */}
            <nav className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-xs font-black uppercase tracking-wider text-black bg-white border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Upload
              </Link>
              <Link 
                href="/status" 
                className="text-xs font-black uppercase tracking-wider text-black bg-white border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Statuses
              </Link>
            </nav>

            {/* Right side badge */}
            <div className="hidden sm:flex items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-black bg-[#4ADE80] px-3.5 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
        <footer className="w-full border-t-4 border-black bg-white py-6 shadow-[0_-4px_0_0_rgba(0,0,0,1)] mt-auto">
          <div className="container mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-black uppercase tracking-wide">
              &copy; {new Date().getFullYear()} SignFlow. Built for the SDE Internship Assessment.
            </p>
            <p className="text-xs font-bold text-black bg-[#FFF455] px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Persisted with local SQLite database
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}

