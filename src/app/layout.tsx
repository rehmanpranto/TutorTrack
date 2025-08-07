import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/Providers";
import { ErrorBoundary } from "../components/ErrorBoundary";

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
        className="antialiased bg-[#F8F3CE] text-[#57564F] font-mono min-h-screen"
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
