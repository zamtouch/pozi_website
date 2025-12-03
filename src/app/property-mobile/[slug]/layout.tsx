import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Property - POZI Student Living',
  description: 'View property details on POZI Student Living',
};

export default function PropertyMobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout just passes through children - no header/footer
  // The ConditionalLayout in root layout will handle excluding header/footer
  return <>{children}</>;
}

