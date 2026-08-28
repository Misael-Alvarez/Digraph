import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { AppProviders } from '@/components/app/AppProviders';
import { PREFERENCES_KEY } from '@/lib/editor/uiState';
import './globals.css';

/**
 * The product typeface.
 *
 * Self-hosted by `next/font`, so it costs no third-party request and cannot
 * flash unstyled text. Plus Jakarta Sans is chosen over the system stack for a
 * reason the system stack cannot give: one identical shape on macOS, Windows
 * and Linux, which matters for an editor whose chrome sits at 11–13px, where
 * Segoe UI and Roboto disagree about metrics enough to shift every panel.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

/** Code, keycaps and any number that has to line up in a column. */
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});

export const metadata: Metadata = {
  title: 'AC Graph',
  description: 'Cloud architecture diagrams for developers: draw them, or write them.',
};

/** `color-scheme` makes native scrollbars and form controls follow the theme. */
export const viewport: Viewport = {
  // The chrome is dark unless the reader has asked for light, so the browser's
  // own furniture matches by default.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f1115' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1115' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`dark ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* The theme, before the first paint.
            The class is applied by React once it has hydrated, which is far too
            late: every load flashed white before turning dark. This reads the
            same stored preference the app does and corrects the markup — which
            ships dark, the default — while the parser is still in <head>. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(PREFERENCES_KEY)})||'{}');if(p&&p.dark===false)document.documentElement.classList.remove('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
