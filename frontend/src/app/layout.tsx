import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'CNHS Extracurricular & Student Development System',
  description: 'Centralized extracurricular management, digital participation portfolios, attendance tracking, and badge recognition for Centrala National High School, Surallah, South Cotabato.',
  keywords: [
    'Centrala National High School',
    'CNHS Surallah',
    'Extracurricular Activities',
    'Student Development System',
    'South Cotabato',
    'DepEd',
    'Student Portfolio',
    'Digital Badges',
    'Attendance Tracking',
  ],
  authors: [{ name: 'Centrala National High School Development Team' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
