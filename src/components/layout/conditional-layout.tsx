'use client';

import { usePathname } from 'next/navigation';
import Header from './header';
import Footer from './footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Routes that should NOT have header and footer
  // Check exact match or starts with (to handle query params)
  const excludeRoutes = ['/auth/register-mobile2', '/auth/register-mobile-ios2', '/property-mobile'];
  const shouldExclude = excludeRoutes.some(route => {
    if (!pathname) return false;
    // Remove query params for comparison
    const cleanPath = pathname.split('?')[0];
    return cleanPath === route || cleanPath.startsWith(route + '/');
  });

  if (shouldExclude) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

