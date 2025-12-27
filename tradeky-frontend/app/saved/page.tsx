'use client';
import { useEffect, useState } from 'react';

export default function SavedPage() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://tradeky-backend.onrender.com/api/community')
      .then(res => res.json())
      .then(data => {
        const uid = localStorage.getItem('uid');
        setPosts(data.filter((p: any) => p.savedBy?.includes(uid)));
      });
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-xl mb-4">Saved Strategies</h1>
      {posts.map(p => (
        <div key={p._id} className="bg-zinc-900 p-3 rounded mb-2">
          {p.content}
        </div>
      ))}
    </div>
  );
}
