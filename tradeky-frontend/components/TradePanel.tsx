'use client';

type Props = {
  symbol: string;
  livePrice: number;
  onTrade: (side: 'BUY' | 'SELL') => void;
};

export default function TradePanel({ symbol, livePrice, onTrade }: Props) {
  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Trade Panel</h2>

      <p className="text-gray-400">Live Price</p>
      <p className="text-xl font-bold mb-4">
        ₹{livePrice.toFixed(2)}
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => onTrade('BUY')}
          className="bg-green-600 px-4 py-2 rounded"
        >
          BUY
        </button>

        <button
          onClick={() => onTrade('SELL')}
          className="bg-red-600 px-4 py-2 rounded"
        >
          SELL
        </button>
      </div>
    </div>
  );
}
