import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CsrfProvider } from "@/components/providers/CsrfProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getSession } from "@/lib/auth/session";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" });

export const metadata: Metadata = {
  title: "RapidRead",
  description: "Fast, explainable personalized news built for focused reading."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sourceSerif.variable} font-sans`}>
        <ThemeProvider>
          <CsrfProvider>
            <SiteHeader authenticated={Boolean(session)} userEmail={session?.user.email} />
            <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</main>
          </CsrfProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
