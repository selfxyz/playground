'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Playground = dynamic(() => import("./components/Playground"), {
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
