import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Akriti ♡ — Our Little Universe",
  description: "A handmade digital scrapbook of our relationship. Made by Uddhav, for Akriti.",
  openGraph: {
    title: "For Akriti ♡ — Our Little Universe",
    description: "A handmade digital scrapbook of our relationship.",
    type: "website",
  },
};

export default function AkritiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}