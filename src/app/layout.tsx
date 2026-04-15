import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artist House Portal",
  description: "Resources portal for Artist House community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
