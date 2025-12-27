'use client';

type Props = {
  active: Record<string, boolean>;
  toggle: (name: string) => void;
};

const INDICATORS = [
  { key: 'ema9', label: 'EMA 9', type: 'overlay' },
  { key: 'ema21', label: 'EMA 21', type: 'overlay' },
  { key: 'sma50', label: 'SMA 50', type: 'overlay' },
  { key: 'sma200', label: 'SMA 200', type: 'overlay' },
  { key: 'bb', label: 'Bollinger Bands', type: 'overlay' },
  { key: 'vwap', label: 'VWAP', type: 'overlay' },
  { key: 'rsi', label: 'RSI', type: 'oscillator' },
  { key: 'macd', label: 'MACD', type: 'oscillator' },
];

export default function IndicatorPanel({ active, toggle }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 w-64">
      <h3 className="text-sm font-semibold mb-2">Indicators</h3>

      <div className="space-y-2 text-sm">
        {INDICATORS.map(ind => (
          <label
            key={ind.key}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="text-gray-300">{ind.label}</span>
            <input
              type="checkbox"
              checked={!!active[ind.key]}
              onChange={() => toggle(ind.key)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
