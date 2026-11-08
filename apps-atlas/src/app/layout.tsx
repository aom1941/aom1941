import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apps Atlas",
  description:
    "Übersicht der AOM-Apps, Fähigkeiten, apps-database-Bedarf und kompakter Zielstruktur",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
