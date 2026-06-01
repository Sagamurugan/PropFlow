import './globals.css';
import React from 'react';

export const metadata = {
  title: 'PropFlow AI - Multi-Tenant Property SaaS',
  description: 'AI-Powered multi-tenant property and rental management platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}
