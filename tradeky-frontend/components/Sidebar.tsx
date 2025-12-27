'use client';

import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-56 bg-zinc-950 border-r border-zinc-800 p-4">
      <h2 className="text-lg font-semibold mb-6">TradeKY</h2>

      <nav className="space-y-3 text-sm">
        <button
          onClick={() => router.push('/dashboard')}
          className="block w-full text-left text-zinc-300 hover:text-white"
        >
          Dashboard
        </button>

        <button className="block w-full text-left text-zinc-300 hover:text-white">
          Markets
        </button>

        <button className="block w-full text-left text-zinc-300 hover:text-white">
          Orders
        </button>

        <button className="block w-full text-left text-zinc-300 hover:text-white">
          Portfolio
        </button>

        <button className="block w-full text-left text-zinc-300 hover:text-white">
          Settings
        </button>
      </nav>
    </aside>
  );
}
