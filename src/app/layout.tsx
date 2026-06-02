import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Library",
  description: "A small reading-list library app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          padding: "2rem",
          maxWidth: 760,
          marginInline: "auto",
          color: "#1a1a1a",
        }}
      >
        {children}
      </body>
    </html>
  );
}
