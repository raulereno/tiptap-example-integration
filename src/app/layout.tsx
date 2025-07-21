import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiptap Editor",
  description: "Example of a tiptap editor implementation with placeholders and export to docx functionality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
