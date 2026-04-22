'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const Playground = dynamic(() => import('./components/Playground'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center">
      Loading application...
    </div>
  ),
});

export default function Page() {
  return <Playground />;
}
