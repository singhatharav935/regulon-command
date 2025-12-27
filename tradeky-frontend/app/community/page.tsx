'use client';

import { useState } from 'react';
import CreatePost from '@/components/CreatePost';
import CommunityFeed from '@/components/CommunityFeed';

export default function CommunityPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Community Feed</h1>

      <CreatePost onPostCreated={() => setRefreshKey(k => k + 1)} />

      <div className="mt-6">
        <CommunityFeed refreshKey={refreshKey} />
      </div>
    </div>
  );
}
