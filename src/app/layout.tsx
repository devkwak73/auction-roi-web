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
        borderBottom: '1px solid var(--border)', 
        padding: '16px 0', 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'rgba(15, 23, 42, 0.8)', 
        backdropFilter: 'blur(12px)',
        zIndex: 50
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '20px', fontWeight: 800, background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AuctionROI
          </Link>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: 500 }}>
            <Link href="/" style={{ color: pathname === '/' ? '#818cf8' : '#94a3b8' }}>대시보드</Link>
            <Link href="/admin" style={{ color: pathname === '/admin' ? '#818cf8' : '#94a3b8' }}>관리자</Link>
            <Link href="/settings" style={{ color: pathname === '/settings' ? '#818cf8' : '#94a3b8' }}>설정</Link>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0', marginTop: 'auto' }}>
        <div className="container" style={{ textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          © 2026 AuctionROI Manager. Built for Web.
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
