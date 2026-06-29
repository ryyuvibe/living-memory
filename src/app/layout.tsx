import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Living Memory",
  description:
    "Today's AI memory is a filing cabinet of flat facts. A better memory is a living model.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-mono">{children}</body>
    </html>
  );
}
