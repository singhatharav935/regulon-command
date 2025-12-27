'use client';

import { useState } from 'react';

type Props = {
  onPostCreated?: () => void;
};

export default function CreatePost({ onPostCreated }: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Login required');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        'https://tradeky-backend.onrender.com/api/community',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!res.ok) {
        throw new Error('Post failed');
      }

      setContent('');
      onPostCreated?.();
    } catch (err) {
      console.error(err);
      alert('Failed to post strategy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Share your trading strategy..."
        className="w-full bg-black border border-zinc-700 rounded p-3 text-sm min-h-[100px]"
      />

      <button
        onClick={submit}
        disabled={loading}
        className="mt-3 bg-yellow-500 text-black px-4 py-1 rounded text-sm disabled:opacity-50"
      >
        {loading ? 'Posting...' : 'Post Strategy'}
      </button>
    </div>
  );
}
