'use client';

import { useEffect, useState } from 'react';

type Comment = {
  _id?: string;
  text: string;
  createdAt: string;
  user?: { name?: string; _id?: string };
};

type Post = {
  _id: string;
  content: string;
  createdAt: string;
  user?: {
    _id?: string;
    name?: string;
  };
  likes?: string[];
  savedBy?: string[];
  comments?: Comment[];
};

export default function SavedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  /* ================= LOAD SAVED POSTS ================= */
  const loadSaved = async () => {
    if (!token) return;

    setLoading(true);
    const res = await fetch(
      'https://tradeky-backend.onrender.com/api/community/saved',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  };

  /* ================= CURRENT USER ================= */
  useEffect(() => {
    if (!token) return;
    fetch('https://tradeky-backend.onrender.com/api/protected', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setMyUserId(data?.user?.id));
  }, [token]);

  useEffect(() => {
    loadSaved();
  }, []);

  /* ================= LIKE ================= */
  const toggleLike = async (id: string) => {
    await fetch(
      `https://tradeky-backend.onrender.com/api/community/${id}/like`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    loadSaved();
  };

  /* ================= UNSAVE ================= */
  const toggleSave = async (id: string) => {
    await fetch(
      `https://tradeky-backend.onrender.com/api/community/${id}/save`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    loadSaved();
  };

  /* ================= COMMENT ================= */
  const addComment = async (id: string) => {
    const text = commentText[id];
    if (!text?.trim()) return;

    await fetch(
      `https://tradeky-backend.onrender.com/api/community/${id}/comment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }
    );

    setCommentText(p => ({ ...p, [id]: '' }));
    loadSaved();
  };

  if (!token) {
    return <p className="text-gray-400">Login required</p>;
  }

  if (loading) {
    return <p className="text-gray-400">Loading saved strategies…</p>;
  }

  if (!posts.length) {
    return <p className="text-gray-400">No saved strategies yet.</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Saved Strategies</h1>

      {posts.map(post => {
        const isLiked = post.likes?.includes(myUserId || '');

        return (
          <div
            key={post._id}
            className="bg-zinc-900 p-4 rounded border border-zinc-800"
          >
            <p className="text-sm whitespace-pre-wrap">
              {post.content}
            </p>

            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-gray-400">
                {post.user?.name || 'Trader'} •{' '}
                {new Date(post.createdAt).toLocaleString()}
              </p>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => toggleLike(post._id)}
                  className={`px-2 py-0.5 rounded ${
                    isLiked ? 'bg-green-600' : 'bg-zinc-700'
                  }`}
                >
                  👍 {post.likes?.length ?? 0}
                </button>

                <button
                  onClick={() => toggleSave(post._id)}
                  className="px-2 py-0.5 rounded bg-blue-600"
                >
                  Unsave
                </button>
              </div>
            </div>

            {/* COMMENTS */}
            <div className="mt-4 space-y-2">
              {post.comments?.map(c => (
                <div
                  key={c._id}
                  className="text-xs bg-black/40 p-2 rounded"
                >
                  <b>{c.user?.name || 'Trader'}:</b> {c.text}
                </div>
              ))}
            </div>

            {/* ADD COMMENT */}
            <div className="mt-3 flex gap-2">
              <input
                value={commentText[post._id] || ''}
                onChange={e =>
                  setCommentText(p => ({
                    ...p,
                    [post._id]: e.target.value,
                  }))
                }
                placeholder="Write a comment…"
                className="flex-1 bg-black border border-zinc-700 rounded px-2 py-1 text-xs"
              />
              <button
                onClick={() => addComment(post._id)}
                className="bg-zinc-700 px-3 py-1 rounded text-xs"
              >
                Post
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
