import type { Metadata } from 'next';
import { AppProviders } from '@/components/app/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'AION Architecture Studio',
  description: 'Cloud architecture diagrams for developers: draw them or write them.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
