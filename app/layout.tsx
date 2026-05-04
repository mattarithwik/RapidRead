import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RapidRead",
  description: "Fast, explainable personalized news built for focused reading."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">
            RapidRead
          </Link>
          <nav className="nav">
            <Link href="/">Feed</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
