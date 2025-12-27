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
    followers?: string[];
  };
  likes?: string[];
  savedBy?: string[];
  comments?: Comment[];
};

export default function CommunityFeed({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  /* ================= LOAD POSTS ================= */
  const loadPosts = () => {
    setLoading(true);
    fetch('https://tradeky-backend.onrender.com/api/community')
      .then(res => res.json())
      .then(setPosts)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, [refreshKey]);

  /* ================= CURRENT USER ================= */
  useEffect(() => {
    if (!token) return;
    fetch('https://tradeky-backend.onrender.com/api/protected', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setMyUserId(data?.user?.id));
  }, [token]);

  /* ================= LIKE ================= */
  const toggleLike = async (id: string) => {
    if (!token) return alert('Login required');
    await fetch(
      `https://tradeky-backend.onrender.com/api/community/${id}/like`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    loadPosts();
  };

  /* ================= SAVE ================= */
  const toggleSave = async (id: string) => {
    if (!token) return alert('Login required');
    await fetch(
      `https://tradeky-backend.onrender.com/api/community/${id}/save`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    loadPosts();
  };

  /* ================= DELETE POST ================= */
  const deletePost = async (id: string) => {
    if (!token) return;
    if (!confirm('Delete this strategy?')) return;

    await fetch(
      `https://tradeky-backend.onrender.com/api/community/${id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    );
    loadPosts();
  };

  /* ================= COMMENT ================= */
  const addComment = async (id: string) => {
    if (!token) return alert('Login required');
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
    loadPosts();
  };

  /* ================= DELETE COMMENT ================= */
  const deleteComment = async (postId: string, commentId?: string) => {
    if (!token || !commentId) return;
    if (!confirm('Delete this comment?')) return;

    await fetch(
      `https://tradeky-backend.onrender.com/api/community/${postId}/comment/${commentId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    );
    loadPosts();
  };

  /* ================= FOLLOW ================= */
  const followUser = async (userId: string) => {
    if (!token) return alert('Login required');
    await fetch(
      `https://tradeky-backend.onrender.com/api/community/follow/${userId}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    loadPosts();
  };

  if (loading) return <p className="text-gray-400">Loading strategies…</p>;
  if (!posts.length) return <p className="text-gray-400">No strategies yet.</p>;

  return (
    <div className="space-y-4">
      {posts.map(post => {
        const isOwnPost = post.user?._id === myUserId;
        const isFollowing = post.user?.followers?.includes(myUserId || '');
        const isLiked = post.likes?.includes(myUserId || '');
        const isSaved = post.savedBy?.includes(myUserId || '');

        return (
          <div key={post._id} className="bg-zinc-900 p-4 rounded border border-zinc-800">
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>

            {/* META */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-gray-400">
                {post.user?.name || 'Trader'} •{' '}
                {new Date(post.createdAt).toLocaleString()}
              </p>

              <div className="flex gap-2 text-xs items-center">
                {!isOwnPost && post.user?._id && (
                  <button
                    onClick={() => followUser(post.user!._id!)}
                    className={`px-2 py-0.5 rounded ${
                      isFollowing ? 'bg-zinc-700' : 'bg-yellow-500 text-black'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}

                <button
                  onClick={() => toggleLike(post._id)}
                  className={`px-2 py-0.5 rounded ${
                    isLiked ? 'bg-green-600 text-white' : 'bg-zinc-700'
                  }`}
                >
                  👍 {post.likes?.length ?? 0}
                </button>

                <button
                  onClick={() => toggleSave(post._id)}
                  className={`px-2 py-0.5 rounded ${
                    isSaved ? 'bg-blue-600 text-white' : 'bg-zinc-700'
                  }`}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </button>

                {isOwnPost && (
                  <button
                    onClick={() => deletePost(post._id)}
                    className="px-2 py-0.5 rounded bg-red-600 text-white"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* COMMENTS */}
            <div className="mt-4 space-y-2">
              {post.comments?.map(c => {
                const ownComment = c.user?._id === myUserId;
                return (
                  <div
                    key={c._id}
                    className="text-xs bg-black/40 p-2 rounded flex justify-between"
                  >
                    <span>
                      <b>{c.user?.name || 'Trader'}:</b> {c.text}
                    </span>
                    {ownComment && (
                      <button
                        onClick={() => deleteComment(post._id, c._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ADD COMMENT */}
            <div className="mt-3 flex gap-2">
              <input
                value={commentText[post._id] || ''}
                onChange={e =>
                  setCommentText(p => ({ ...p, [post._id]: e.target.value }))
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
