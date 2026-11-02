import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reporty — Il feedback, nel punto giusto.',
  description: 'Feedback visivo e revisioni per siti e app web.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="it"><body>{children}</body></html>;
}
