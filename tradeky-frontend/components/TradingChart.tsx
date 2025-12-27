'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickData,
  LineData,
  ISeriesApi,
} from 'lightweight-charts';

const TIMEFRAMES = { '1m': 60, '5m': 300, '15m': 900 };

type IndicatorsState = {
  ema9: boolean;
  ema21: boolean;
  sma50: boolean;
  sma200: boolean;
  bb: boolean;
  vwap: boolean;
};

export default function TradingChart({ onPriceUpdate }: any) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeries = useRef<any>(null);

  // 🔒 CREATE ONCE – NEVER REMOVE
  const ema9 = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21 = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50 = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200 = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpper = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLower = useRef<ISeriesApi<'Line'> | null>(null);
  const vwap = useRef<ISeriesApi<'Line'> | null>(null);

  const candles = useRef<CandlestickData[]>([]);
  const volume = useRef<number[]>([]);

  const [tf, setTf] = useState<'1m' | '5m' | '15m'>('1m');
  const [ind, setInd] = useState<IndicatorsState>({
    ema9: false,
    ema21: false,
    sma50: false,
    sma200: false,
    bb: false,
    vwap: false,
  });

  const now = () => Math.floor(Date.now() / 1000);

  /* ================= CHART INIT ================= */
  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      height: 420,
      width: containerRef.current.clientWidth,
      layout: { background: { color: '#000' }, textColor: '#d1d4dc' },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      timeScale: { timeVisible: true, secondsVisible: tf === '1m' },
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.25 } },
    });

    candleSeries.current = chartRef.current.addCandlestickSeries();

    // 🔒 CREATE INDICATORS ONCE
    ema9.current = chartRef.current.addLineSeries({ color: '#22c55e', visible: false });
    ema21.current = chartRef.current.addLineSeries({ color: '#3b82f6', visible: false });
    sma50.current = chartRef.current.addLineSeries({ color: '#f59e0b', visible: false });
    sma200.current = chartRef.current.addLineSeries({ color: '#ef4444', visible: false });
    bbUpper.current = chartRef.current.addLineSeries({ color: '#a855f7', visible: false });
    bbLower.current = chartRef.current.addLineSeries({ color: '#a855f7', visible: false });
    vwap.current = chartRef.current.addLineSeries({ color: '#14b8a6', visible: false });

    initData();
    candleSeries.current.setData(candles.current);
    chartRef.current.timeScale().fitContent();

    const interval = setInterval(tick, 1000);

    return () => {
      clearInterval(interval);
      chartRef.current.remove();
    };
  }, [tf]);

  /* ================= TOGGLE VISIBILITY ================= */
  useEffect(() => {
    ema9.current?.applyOptions({ visible: ind.ema9 });
    ema21.current?.applyOptions({ visible: ind.ema21 });
    sma50.current?.applyOptions({ visible: ind.sma50 });
    sma200.current?.applyOptions({ visible: ind.sma200 });
    bbUpper.current?.applyOptions({ visible: ind.bb });
    bbLower.current?.applyOptions({ visible: ind.bb });
    vwap.current?.applyOptions({ visible: ind.vwap });
  }, [ind]);

  /* ================= DATA ================= */
  function initData() {
    candles.current = [];
    volume.current = [];

    let t = now() - TIMEFRAMES[tf] * 60;
    let price = 42000;

    for (let i = 0; i < 60; i++) {
      const close = price + (Math.random() - 0.5) * 50;
      candles.current.push({
        time: t,
        open: price,
        high: Math.max(price, close) + 20,
        low: Math.min(price, close) - 20,
        close,
      });
      volume.current.push(Math.random() * 1000);
      price = close;
      t += TIMEFRAMES[tf];
    }

    recalcIndicators();
  }

  function tick() {
    const period = TIMEFRAMES[tf];
    const t = now();
    const last = candles.current.at(-1)!;

    const candleStart = Math.floor(last.time / period) * period;
    const currentStart = Math.floor(t / period) * period;
    const newPrice = last.close + (Math.random() - 0.5) * 20;

    if (currentStart === candleStart) {
      last.close = newPrice;
      last.high = Math.max(last.high, newPrice);
      last.low = Math.min(last.low, newPrice);
      candleSeries.current.update(last);
    } else {
      const candle = {
        time: currentStart,
        open: last.close,
        high: newPrice,
        low: newPrice,
        close: newPrice,
      };
      candles.current.push(candle);
      volume.current.push(Math.random() * 1000);
      candleSeries.current.update(candle);
    }

    recalcIndicators();
    onPriceUpdate?.(newPrice);
  }

  /* ================= INDICATORS ================= */
  function recalcIndicators() {
    const ema9Data = calcEMA(candles.current, 9);
    const ema21Data = calcEMA(candles.current, 21);
    const sma50Data = calcSMA(candles.current, 50);
    const sma200Data = calcSMA(candles.current, 200);
    const { upper, lower } = calcBB(candles.current, 20);
    const vwapData = calcVWAP(candles.current, volume.current);

    ema9.current?.setData(ema9Data);
    ema21.current?.setData(ema21Data);
    sma50.current?.setData(sma50Data);
    sma200.current?.setData(sma200Data);
    bbUpper.current?.setData(upper);
    bbLower.current?.setData(lower);
    vwap.current?.setData(vwapData);
  }

  /* ================= UI ================= */
  function toggle(name: keyof IndicatorsState) {
    setInd(p => ({ ...p, [name]: !p[name] }));
  }

  return (
    <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
      <div className="flex gap-2 mb-2 text-xs">
        {(['1m','5m','15m'] as const).map(x => (
          <button key={x} onClick={() => setTf(x)}
            className={`px-2 py-1 rounded ${tf===x?'bg-yellow-500 text-black':'bg-zinc-800'}`}>
            {x}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-2 text-xs flex-wrap">
        {(Object.keys(ind) as (keyof IndicatorsState)[]).map(k => (
          <button key={k} onClick={() => toggle(k)}
            className={`px-2 py-1 rounded ${ind[k]?'bg-green-600':'bg-zinc-800'}`}>
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      <div ref={containerRef} className="w-full h-[420px]" />
    </div>
  );
}

/* ================= MATH ================= */
function calcEMA(c: CandlestickData[], p: number): LineData[] {
  const k = 2 / (p + 1);
  let ema = c[0].close;
  return c.map(x => {
    ema = x.close * k + ema * (1 - k);
    return { time: x.time, value: ema };
  });
}

function calcSMA(c: CandlestickData[], p: number): LineData[] {
  return c.map((x, i) => {
    if (i < p) return { time: x.time, value: x.close };
    const avg = c.slice(i - p, i).reduce((a, b) => a + b.close, 0) / p;
    return { time: x.time, value: avg };
  });
}

function calcBB(c: CandlestickData[], p: number) {
  const upper: LineData[] = [];
  const lower: LineData[] = [];
  c.forEach((x, i) => {
    if (i < p) return;
    const slice = c.slice(i - p, i);
    const mean = slice.reduce((a, b) => a + b.close, 0) / p;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b.close - mean) ** 2, 0) / p);
    upper.push({ time: x.time, value: mean + 2 * std });
    lower.push({ time: x.time, value: mean - 2 * std });
  });
  return { upper, lower };
}

function calcVWAP(c: CandlestickData[], v: number[]): LineData[] {
  let pv = 0, tv = 0;
  return c.map((x, i) => {
    pv += x.close * v[i];
    tv += v[i];
    return { time: x.time, value: pv / tv };
  });
}
