import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import { ErrorBoundary } from "../components/ErrorBoundary";

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
});

export const metadata: Metadata = {
  title: "TutorTrack - Tutoring Attendance Tracker",
  description: "Track tutoring attendance and manage session topics with monthly reports",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} antialiased bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-800 text-gray-900 dark:text-gray-100 font-sans min-h-screen transition-colors duration-300`}
      >
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
