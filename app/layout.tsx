import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Phone Manager Lite",
  description: "Phone management tool built with Next.js and React.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-black dark:text-zinc-100 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <section className="space-y-2">
              <p className="text-sm lowercase tracking-[0.25em] text-zinc-500">phonemanager.shanehoey.dev</p>
              <h1 className="text-3xl font-semibold">Phone Manager lite</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Looking for instructions or a template? Head over to{" "}<a href="https://github.com/shanehoey/ip-phone-manager-lite#readme" className="font-medium text-zinc-950 dark:text-zinc-50">Github</a>.
              </p>
              <section className="mt-10 flex flex-wrap gap-3">
                <button className="flex min-w-[120px] items-center justify-center rounded-lg bg-green-700 px-3 py-2 text-green-100 hover:bg-green-500">
                  <a href="/phonemanager/">Home</a>
                </button>
                <button className="flex min-w-[120px] items-center justify-center rounded-lg bg-green-700 px-3 py-2 text-green-100 hover:bg-green-500">
                  <a href="/phonemanager/devices">Devices</a>
                </button>
                <button className="flex min-w-[120px] items-center justify-center rounded-lg bg-green-700 px-3 py-2 text-green-100 hover:bg-green-500">
                  <a href="/phonemanager/firmware">Firmware Upload</a>
                </button>
                <button className="flex min-w-[120px] items-center justify-center rounded-lg bg-green-700 px-3 py-2 text-green-100 hover:bg-green-500">
                  <a href="/phonemanager/redirects">Redirect Mapping</a>
                </button>
                <button className="flex min-w-[120px] items-center justify-center rounded-lg bg-green-700 px-3 py-2 text-green-100 hover:bg-green-500">
                  <a href="/phonemanager/configuration">Configuration Editor</a>
                </button>
              </section>
            </section>
          </div>
        </header>
        <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900 dark:bg-black dark:text-zinc-100 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
              {children}
          </div>
        </main>
      </body>
    </html>
  );
}
