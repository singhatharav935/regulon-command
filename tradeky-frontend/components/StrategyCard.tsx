'use client';

import FollowButton from './FollowButton';

export default function StrategyCard({ post }: any) {
  async function like() {
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(
      `https://tradeky-backend.onrender.com/api/community/like/${post._id}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  return (
    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="font-semibold">{post.authorName}</p>
          <p className="text-xs text-gray-400">
            {post.symbol} • {post.timeframe}
          </p>
        </div>

        <FollowButton userId={post.authorId} />
      </div>

      <h3 className="font-medium">{post.title}</h3>
      <p className="text-gray-300 text-sm mb-3">{post.description}</p>

      <button
        onClick={like}
        className="text-sm text-gray-400 hover:text-white"
      >
        👍 {post.likes}
      </button>
    </div>
  );
}
