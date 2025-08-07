import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/Providers";

export const metadata: Metadata = {
  title: "TutorTrack - Tutoring Attendance Tracker",
  description: "Track tutoring attendance and manage session topics with monthly reports",
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
