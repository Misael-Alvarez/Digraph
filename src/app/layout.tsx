import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AION Architecture Studio',
  description: 'Professional cloud architecture diagram editor by AION Cloud',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
