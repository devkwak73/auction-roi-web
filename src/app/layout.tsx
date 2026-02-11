'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/waiting-approval';

  const content = isAuthPage ? (
    <main>{children}</main>
  ) : (
    <>
      <nav style={{ 
        backgroundColor: 'var(--primary)', 
        color: '#ffffff', 
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
            🏠 경매도우미
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/settings" style={{ fontSize: '24px', textDecoration: 'none', color: '#ffffff' }}>⚙️</Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer style={{ backgroundColor: '#11221a', color: 'rgba(255, 255, 255, 0.6)', padding: '24px 0', marginTop: 'auto' }}>
        <div className="container" style={{ textAlign: 'center', fontSize: '13px' }}>
          © 2026 AuctionHelper. Built for Boonom.
        </div>
      </footer>
    </>
  );

  return (
    <html lang="ko">
      <body>
        {content}
      </body>
    </html>
  );
}
