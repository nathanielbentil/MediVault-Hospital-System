'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    const target = tab ? `/?tab=${encodeURIComponent(tab)}` : '/?tab=dashboard';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="p-8 rounded-2xl bg-slate-900 border border-purple-500/30 text-center space-y-4 shadow-2xl max-w-sm">
        <div className="h-10 w-10 mx-auto rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">SuperAdmin Command Center</p>
          <p className="text-xs text-slate-400">Opening unified hospital administration workspace...</p>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminRedirectInner />
    </Suspense>
  );
}
