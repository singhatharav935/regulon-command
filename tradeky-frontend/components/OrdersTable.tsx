'use client';

type Position = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entry: number;
  qty: number;
};

type Props = {
  positions: Position[];
  livePrice: number;
  onClose: (id: string) => void;
};

export default function OrdersTable({ positions, livePrice, onClose }: Props) {
  function pnl(p: Position) {
    const diff =
      p.side === 'BUY'
        ? livePrice - p.entry
        : p.entry - livePrice;

    return diff * p.qty;
  }

  if (positions.length === 0) {
    return <p className="text-gray-400">No open positions.</p>;
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
            <th className="px-4 py-2">Side</th>
            <th className="px-4 py-2 text-right">Entry</th>
            <th className="px-4 py-2 text-right">Qty</th>
            <th className="px-4 py-2 text-right">P&L</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {positions.map(p => {
            const value = pnl(p);
            return (
              <tr key={p.id} className="border-t border-zinc-800">
                <td className="px-4 py-2">{p.symbol}</td>
                <td
                  className={`px-4 py-2 ${
                    p.side === 'BUY'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {p.side}
                </td>
                <td className="px-4 py-2 text-right">
                  ₹{p.entry.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right">{p.qty}</td>
                <td
                  className={`px-4 py-2 text-right ${
                    value >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  ₹{value.toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onClose(p.id)}
                    className="text-xs bg-zinc-800 px-2 py-1 rounded"
                  >
                    CLOSE
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
