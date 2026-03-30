import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import { MobileWarning } from '@/components/ui/MobileWarning';
import './globals.css';

export const metadata: Metadata = {
  title: 'VideoAI Editor — Edição de Vídeo com IA',
  description: 'Do script ao vídeo editado, sem abrir editor. Transcrição, ilustrações e legendas automáticas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen gradient-bg antialiased">
        <ToastProvider>
          {children}
          <MobileWarning />
        </ToastProvider>
      </body>
    </html>
  );
}
