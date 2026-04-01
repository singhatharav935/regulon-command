"use client";

import { useState } from "react";
import { authFetch } from "@/lib/authFetch";

export default function TradeOrderPanel({
  onTradeSuccess,
}: {
  onTradeSuccess: () => void;
}) {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(42000);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const placeTrade = async (side: "BUY" | "SELL") => {
    setLoading(true);
    setMessage("");

    try {
      const res = await authFetch(
        "http://localhost:7000/api/trades",
        {
          method: "POST",
          body: JSON.stringify({
            symbol,
            side,
            quantity,
            price,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Trade failed");
      }

      setMessage(`${side} order placed successfully`);
      onTradeSuccess();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3>Place Trade</h3>

      <input
        style={styles.input}
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Symbol (e.g. BTCUSDT)"
      />

      <input
        style={styles.input}
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        placeholder="Quantity"
      />

      <input
        style={styles.input}
        type="number"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        placeholder="Price"
      />

      <div style={styles.buttons}>
        <button
          style={{ ...styles.buy, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
          onClick={() => placeTrade("BUY")}
        >
          BUY
        </button>

        <button
          style={{ ...styles.sell, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
          onClick={() => placeTrade("SELL")}
        >
          SELL
        </button>
      </div>

      {message && <p>{message}</p>}
    </div>
  );
}

const styles: any = {
  card: {
    padding: 16,
    border: "1px solid #ddd",
    borderRadius: 8,
    maxWidth: 300,
  },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 8,
  },
  buttons: {
    display: "flex",
    gap: 8,
  },
  buy: {
    flex: 1,
    background: "#0f9d58",
    color: "white",
    padding: 10,
    border: "none",
    cursor: "pointer",
  },
  sell: {
    flex: 1,
    background: "#d93025",
    color: "white",
    padding: 10,
    border: "none",
    cursor: "pointer",
  },
};
