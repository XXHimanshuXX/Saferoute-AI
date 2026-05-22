import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SafeRoute AI - Integrated Emergency Navigation Platform',
  description: 'AI-driven safety navigation, real-time tactical overlays, emergency response routing, and voice-reactive AI co-navigators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-obsidian-950 min-h-screen text-slate-200">
        {children}
      </body>
    </html>
  );
}
