'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import TradingChart from '@/components/TradingChart';
import TradePanel from '@/components/TradePanel';
import OrdersTable from '@/components/OrdersTable';
import { authFetch } from '@/lib/authFetch';

type Position = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entry: number;
  qty: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [symbol, setSymbol] =
    useState<'BTC' | 'NIFTY' | 'BANKNIFTY'>('BTC');
  const [price, setPrice] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>([]);

  /* ================= AUTH ================= */
  useEffect(() => {
    authFetch('https://tradeky-backend.onrender.com/api/protected')
      .then((data: any) => {
        if (data?.__unauthorized) {
          localStorage.removeItem('token');
          router.replace('/login');
          return;
        }
        setUserId(data.user.id);
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.replace('/login');
      });
  }, [router]);

  /* ================= TRADE HANDLER ================= */
  function handleTrade(side: 'BUY' | 'SELL') {
    if (!price) return;

    setPositions(p => [
      ...p,
      {
        id: crypto.randomUUID(),
        symbol,
        side,
        entry: price,
        qty: 1,
      },
    ]);
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">TradeKY</h1>
          <p className="text-sm text-gray-400">
            User: {userId ?? 'Loading...'}
          </p>
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-3">
          <a
            href="/community"
            className="px-3 py-2 bg-zinc-800 rounded text-sm hover:bg-zinc-700"
          >
            Community
          </a>

          <select
            value={symbol}
            onChange={e =>
              setSymbol(e.target.value as 'BTC' | 'NIFTY' | 'BANKNIFTY')
            }
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm"
          >
            <option value="BTC">BTC</option>
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
          </select>
        </div>
      </div>

      {/* ===== CHART ===== */}
      <TradingChart onPriceUpdate={setPrice} />

      {/* ===== TRADE PANEL ===== */}
      <TradePanel
        symbol={symbol}
        livePrice={price}
        onTrade={handleTrade}
      />

      {/* ===== POSITIONS / ORDERS ===== */}
      <OrdersTable
        positions={positions}
        livePrice={price}
        onClose={id =>
          setPositions(p => p.filter(x => x.id !== id))
        }
      />
    </div>
  );
}
