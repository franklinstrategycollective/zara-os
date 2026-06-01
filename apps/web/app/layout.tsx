import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zara OS — AI-Native Healthcare Operating System',
  description: 'The operating system for hospitals and independent practices. Built by Dr. Jessica Edwards.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
