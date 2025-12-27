'use client';
import { useEffect, useState } from 'react';

export default function UserProfile({ params }: any) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`https://tradeky-backend.onrender.com/api/users/${params.id}`)
      .then(res => res.json())
      .then(setData);
  }, [params.id]);

  if (!data) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-semibold">{data.user.name}</h1>
      <p className="text-sm text-gray-400">
        Followers: {data.user.followers.length}
      </p>

      <div className="mt-6 space-y-3">
        {data.posts.map((p: any) => (
          <div key={p._id} className="bg-zinc-900 p-3 rounded">
            {p.content}
          </div>
        ))}
      </div>
    </div>
  );
}
