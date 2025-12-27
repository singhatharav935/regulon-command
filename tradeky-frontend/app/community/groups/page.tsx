'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Group = {
  _id: string;
  name: string;
  description?: string;
  members?: string[];
  isPrivate?: boolean;
  owner?: { _id: string; name: string };
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  /* ================= CURRENT USER ================= */
  useEffect(() => {
    if (!token) return;
    fetch('https://tradeky-backend.onrender.com/api/protected', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setMyUserId(data?.user?.id));
  }, [token]);

  /* ================= LOAD GROUPS ================= */
  useEffect(() => {
    fetch('https://tradeky-backend.onrender.com/api/groups', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(setGroups)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-gray-400">Loading groups…</p>;

  const myGroups = groups.filter(
    g =>
      g.owner?._id === myUserId ||
      g.members?.includes(myUserId || '')
  );

  const discoverGroups = groups.filter(
    g =>
      g.owner?._id !== myUserId &&
      !g.members?.includes(myUserId || '')
  );

  const GroupCard = ({ group }: { group: Group }) => {
    const isOwner = group.owner?._id === myUserId;
    const isMember = group.members?.includes(myUserId || '');

    return (
      <Link
        href={`/community/groups/${group._id}`}
        className="block bg-zinc-900 border border-zinc-800 rounded p-4 hover:bg-zinc-800 transition"
      >
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{group.name}</h3>

          <div className="flex gap-1 text-[10px]">
            {group.isPrivate && (
              <span className="bg-red-600 px-2 py-0.5 rounded">PRIVATE</span>
            )}
            {isOwner && (
              <span className="bg-yellow-500 text-black px-2 py-0.5 rounded">
                OWNER
              </span>
            )}
            {!isOwner && isMember && (
              <span className="bg-green-600 px-2 py-0.5 rounded">
                MEMBER
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-1">
          {group.description || 'No description'}
        </p>

        <p className="text-xs text-gray-500 mt-2">
          Members: {group.members?.length ?? 0}
        </p>
      </Link>
    );
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Groups</h1>

      {/* MY GROUPS */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">
          My Groups
        </h2>

        {myGroups.length === 0 ? (
          <p className="text-xs text-gray-500">
            You haven’t joined or created any groups yet.
          </p>
        ) : (
          myGroups.map(group => (
            <GroupCard key={group._id} group={group} />
          ))
        )}
      </section>

      {/* DISCOVER */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">
          Discover Groups
        </h2>

        {discoverGroups.length === 0 ? (
          <p className="text-xs text-gray-500">
            No new groups to discover.
          </p>
        ) : (
          discoverGroups.map(group => (
            <GroupCard key={group._id} group={group} />
          ))
        )}
      </section>
    </div>
  );
}
