import type { Metadata } from "next";
import "./globals.css";

// DB-backed pages must not prerender at build time (fixes deploy builds)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Japandi Poster Auto Studio",
  description: "Japandi-style Japanese poster generation and Etsy management system",
};

// Root layout is intentionally bare: the admin tool's header/nav lives in
// src/app/(admin)/layout.tsx, and the public blog has its own in
// src/app/blog/layout.tsx. Keeping this shared shell empty means the public
// site never leaks admin navigation, and vice versa.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "#f5f0e8", color: "#2c2c2c" }}>
        {children}
      </body>
    </html>
  );
}
