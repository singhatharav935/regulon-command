'use client';

export default function FollowButton({ userId }: { userId: string }) {
  async function follow() {
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(
      `https://tradeky-backend.onrender.com/api/community/follow/${userId}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  return (
    <button
      onClick={follow}
      className="text-xs bg-zinc-800 px-2 py-1 rounded"
    >
      Follow
    </button>
  );
}
