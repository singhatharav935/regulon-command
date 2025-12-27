'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';

type Position = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  realizedPnl: number;
};

export default function PositionsTable({
  livePrice,
}: {
  livePrice: number;
}) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('https://tradeky-backend.onrender.com/api/positions')
      .then((data: Position[]) => setPositions(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-gray-400 text-sm">
        Loading positions...
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-gray-400 text-sm">
        No open positions
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800">
      <h2 className="px-4 py-3 text-sm font-semibold border-b border-zinc-800">
        Positions
      </h2>

      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="px-4 py-2 text-left">Symbol</th>
            <th className="px-4 py-2 text-right">Qty</th>
            <th className="px-4 py-2 text-right">Avg</th>
            <th className="px-4 py-2 text-right">P&amp;L</th>
          </tr>
        </thead>

        <tbody>
          {positions.map((p) => {
            const unrealized =
              (livePrice - p.avgPrice) * p.quantity;
            const totalPnl = p.realizedPnl + unrealized;

            return (
              <tr
                key={p.symbol}
                className="border-t border-zinc-800"
              >
                <td className="px-4 py-2">{p.symbol}</td>
                <td className="px-4 py-2 text-right">
                  {p.quantity}
                </td>
                <td className="px-4 py-2 text-right">
                  {p.avgPrice.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-2 text-right font-medium ${
                    totalPnl >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {totalPnl.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
