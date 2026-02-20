import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./ios.css";
import { Providers } from './providers';
import { generateMetadata } from '@/utils/metadata';
import Layout from '@/components/layout/Layout';

export const metadata: Metadata = generateMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen w-screen overflow-hidden">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased h-screen w-screen overflow-hidden m-0 p-0">
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
