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
  const excludeRoutes = ['/auth/register-mobile1'];
  const shouldExclude = excludeRoutes.some(route => pathname?.startsWith(route));

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

