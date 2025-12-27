'use client';

import { useAuth } from '@/context/AuthContext';

export default function TopBar() {
  const { logout } = useAuth();

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-black border-b border-zinc-800">
      <h1 className="text-white font-semibold">TradeKY</h1>

      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-white"
      >
        Logout
      </button>
    </div>
  );
}
