'use client';

import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

export function DemoBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    import('@/lib/api').then(({ getStatus }) =>
      getStatus().then((data) => {
        if (data.demoMode) setShow(true);
      })
    ).catch(() => {});
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-warning">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          Modo demo — dados simulados. Configure as API keys no <code className="bg-warning/10 px-1 rounded">.env</code> para funcionalidade completa.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-warning/60 hover:text-warning transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
