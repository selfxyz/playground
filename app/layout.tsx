import type { Metadata } from 'next';
import { Geist, Geist_Mono, IBM_Plex_Mono } from 'next/font/google';

import { getSelfEnvironmentConfig } from '@/lib/selfEnvironment';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const environmentConfig = getSelfEnvironmentConfig(
  process.env.NEXT_PUBLIC_SELF_ENV,
  process.env.NEXT_PUBLIC_SELF_VERIFY_ENDPOINT_OVERRIDE,
);

export const metadata: Metadata = {
  title: environmentConfig.metadataTitle,
  description: environmentConfig.metadataDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
