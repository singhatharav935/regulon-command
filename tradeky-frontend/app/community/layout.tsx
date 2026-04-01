'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type MenuItem = { name: string; href: string } | { divider: true };

const menu: MenuItem[] = [
  { name: 'Feed', href: '/community' },
  { name: 'Chat', href: '/community/chat' },           // 🆕
  { name: 'Groups', href: '/community/groups' },       // 🆕

  { divider: true },

  { name: 'Media', href: '/community/media' },
  { name: 'Saved Strategies', href: '/community/saved' },
  { name: 'My Posts', href: '/community/my-posts' },

  { divider: true },

  { name: 'Trending', href: '/community/trending' },
  { name: 'Top Traders', href: '/community/top-traders' },
  { name: 'Market News', href: '/community/news' },
];

export default function CommunityLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-800 p-4 space-y-2">
        <h2 className="text-lg font-semibold mb-4">Community</h2>

        {menu.map((item, i) =>
          'divider' in item ? (
            <hr key={i} className="border-zinc-800 my-3" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm ${
                pathname === item.href
                  ? 'bg-zinc-800 text-white'
                  : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          )
        )}
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
