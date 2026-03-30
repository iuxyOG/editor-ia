'use client';

import { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

export function MobileWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => setShow(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg-primary flex items-center justify-center p-6">
      <div className="glass-card p-8 max-w-sm text-center">
        <Monitor className="w-12 h-12 text-brand-blue mx-auto mb-4" />
        <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
          Use em Desktop
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          O VideoAI Editor foi projetado para telas maiores. Para a melhor experiência,
          acesse pelo computador (mínimo 1024px).
        </p>
        <button
          onClick={() => setShow(false)}
          className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" /> Continuar mesmo assim
        </button>
      </div>
    </div>
  );
}
