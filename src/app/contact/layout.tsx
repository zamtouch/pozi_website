import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Pozi Student Housing',
  description: 'Get in touch with Pozi. Contact our support team via email, phone, WhatsApp, or live chat. We\'re here to help you find your perfect student accommodation.',
  keywords: ['contact pozi', 'student housing support', 'pozi help', 'student accommodation help'],
  openGraph: {
    title: 'Contact Us | Pozi Student Housing',
    description: 'Get in touch with Pozi. Contact our support team via email, phone, WhatsApp, or live chat.',
    url: 'https://pozi.com.na/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us | Pozi Student Housing',
    description: 'Get in touch with Pozi. Contact our support team via email, phone, WhatsApp, or live chat.',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


