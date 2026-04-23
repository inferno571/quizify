import React from 'react';
import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="bg-white px-8 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-6 cursor-pointer">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-inner">
               <div className="w-6 h-6 border-4 border-white rounded-full"></div>
            </div>
            <div className="h-10 w-px bg-gray-300 mx-2"></div>
            <div className="leading-tight">
              <div className="font-black text-xl tracking-tight text-[#2c3e50]">QUIZIFY</div>
            </div>
          </Link>
        </div>
      </header>
      <main className="flex-1 bg-white">
        {children}
      </main>
      <footer className="py-6 bg-[#2c3e50] text-[#bdc3c7] text-xs text-center border-t-4 border-[#E67E22]">
        © 2026 Quizify. All rights reserved.
      </footer>
    </>
  );
}
