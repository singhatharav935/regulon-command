'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type Message = {
  _id: string;
  text: string;
  createdAt: string;
  sender?: {
    name?: string;
  };
};

let socket: Socket | null = null;

export default function CommunityChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  /* ================= INIT SOCKET ================= */
  useEffect(() => {
    socket = io('https://tradeky-backend.onrender.com');

    socket.emit('join-general');

    socket.on('new-message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    fetch('https://tradeky-backend.onrender.com/api/chat/general')
      .then(res => res.json())
      .then(setMessages);
  }, []);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!token || !text.trim()) return;

    await fetch(
      'https://tradeky-backend.onrender.com/api/chat/general',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }
    );

    setText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="border-b border-zinc-800 pb-3 mb-3">
        <h1 className="text-xl font-semibold">Community Chat</h1>
        <p className="text-xs text-gray-400">
          Real-time community discussion
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {messages.map(msg => (
          <div
            key={msg._id}
            className="bg-zinc-900 border border-zinc-800 rounded p-2"
          >
            <p className="text-xs text-yellow-400 font-medium">
              {msg.sender?.name || 'Trader'}
            </p>
            <p className="text-sm text-gray-200">{msg.text}</p>
            <p className="text-[10px] text-gray-500 mt-1">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2 border-t border-zinc-800 pt-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2 text-sm"
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-yellow-500 text-black px-4 rounded text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
