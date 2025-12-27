'use client';
import { useEffect, useState } from 'react';

export default function StrategyPage({ params }: any) {
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    fetch(`https://tradeky-backend.onrender.com/api/community/public/${params.id}`)
      .then(res => res.json())
      .then(setPost);
  }, [params.id]);

  if (!post) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 text-white">
      <h1 className="text-lg mb-2">{post.user.name}</h1>
      <p>{post.content}</p>
    </div>
  );
}
