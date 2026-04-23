import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quizify — AI Quiz Generator',
  description: 'AI-powered quiz generator. Upload study material to generate custom quizzes or upload existing question papers to practice instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2c3e50" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23f97316'/><circle cx='50' cy='50' r='20' fill='none' stroke='white' stroke-width='8'/></svg>" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col font-sans bg-white text-[#2c3e50]`}>
        {children}
      </body>
    </html>
  );
}
