import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import { LanguageSelector } from '@/components/language-selector';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata = {
  title: {
    default: 'Telegram Bot Manager Docs',
    template: '%s | Telegram Bot Manager',
  },
  description: 'Biblioteca TypeScript y CLI para automatizar la gestión de bots de Telegram vía BotFather usando GramJS (MTProto).',
  keywords: ['Telegram', 'Bot', 'BotFather', 'GramJS', 'MTProto', 'TypeScript', 'CLI'],
  authors: [{ name: 'MKS2508' }],
  openGraph: {
    type: 'website',
    url: 'https://telegram-bot-manager.dev',
    title: 'Telegram Bot Manager Docs',
    description: 'Automatiza la gestión de bots de Telegram con TypeScript',
    siteName: 'Telegram Bot Manager',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Telegram Bot Manager Docs',
    description: 'Biblioteca TypeScript y CLI para automatizar bots de Telegram',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <RootProvider>
          <nav className="fixed top-4 right-4 z-50">
            <LanguageSelector />
          </nav>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
