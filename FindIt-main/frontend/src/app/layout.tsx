import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "FindIt — Explainable Multimodal Lost & Found System | Sylhet",
  description:
    "AI-powered multimodal lost and found matching and verification system for Sylhet Metropolitan Area. Uses OpenCLIP visual embeddings, Sentence Transformers, and spatiotemporal matching with human-in-the-loop admin verification.",
};

import { AuthProvider } from "../context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#141715] text-[#F3F4EF] antialiased selection:bg-[#45B58A] selection:text-[#141715]"
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      </body>
    </html>
  );
}
