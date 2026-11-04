import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediVault HMS | Hospital Management & EHR System',
  description: 'Secure Hospital Management System with Electronic Health Records, Argon2id authentication, 2FA, and Merkle blockchain audit trail.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
