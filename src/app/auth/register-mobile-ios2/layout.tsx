import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - POZI Student Living',
  description: 'Create your account on POZI Student Living',
};

export default function RegisterMobileIOS2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout just passes through children - no header/footer
  // The ConditionalLayout in root layout will handle excluding header/footer
  return <>{children}</>;
}

