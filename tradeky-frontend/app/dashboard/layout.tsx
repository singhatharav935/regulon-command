'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* TOP BAR */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <h1 className="text-lg font-semibold">TradeKY</h1>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-sm"
        >
          Logout
        </button>
      </header>

      {/* PAGE CONTENT */}
      <main>{children}</main>
    </div>
  );
}
