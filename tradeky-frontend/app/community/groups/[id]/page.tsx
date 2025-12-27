'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

type User = { _id: string; name: string };
type Group = {
  _id: string;
  name: string;
  description: string;
  members: User[];
  owner: User;
  isLocked: boolean;
};

type Message = {
  _id: string;
  text: string;
  createdAt: string;
  sender: User;
};

let socket: Socket | null = null;

export default function GroupPage() {
  const { id } = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  const isOwner = group?.owner._id === myUserId;

  /* ================= SOCKET ================= */
  useEffect(() => {
    socket = io('https://tradeky-backend.onrender.com');
    socket.emit('join-group', id);

    socket.on('new-message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket?.disconnect();
    };
  }, [id]);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    fetch(`https://tradeky-backend.onrender.com/api/groups/${id}`)
      .then(r => r.json())
      .then(setGroup);

    fetch(`https://tradeky-backend.onrender.com/api/chat/group/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setMessages);
  }, [id]);

  useEffect(() => {
    if (!token) return;
    fetch('https://tradeky-backend.onrender.com/api/protected', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setMyUserId(d.user.id));
  }, [token]);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ================= SEND ================= */
  const sendMessage = async () => {
    if (!token || !text.trim()) return;

    await fetch(
      `https://tradeky-backend.onrender.com/api/chat/group/${id}`,
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

  if (!group) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      <div className="bg-zinc-900 p-4 rounded border border-zinc-800 mb-4">
        <h1 className="text-xl font-semibold">{group.name}</h1>
        <p className="text-sm text-gray-400">{group.description}</p>

        {group.isLocked && (
          <p className="text-xs text-red-400 mt-2">
            🔒 Chat locked by admin
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map(m => {
          const isMe = m.sender._id === myUserId;
          return (
            <div
              key={m._id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded text-sm ${
                  isMe
                    ? 'bg-yellow-500 text-black'
                    : 'bg-zinc-800 text-white'
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] text-yellow-400">
                    {m.sender.name}
                  </p>
                )}
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!group.isLocked && (
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2"
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-yellow-500 text-black px-4 rounded"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
