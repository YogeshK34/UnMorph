import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/providers/motion-provider";
import { Providers } from "@/app/providers";
import { site } from "@/lib/site";
import { inter, spaceGrotesk, spaceMono, syne } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFDF5",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${inter.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full">
        <Providers>
          <MotionProvider>{children}</MotionProvider>
        </Providers>
      </body>
    </html>
  );
}
