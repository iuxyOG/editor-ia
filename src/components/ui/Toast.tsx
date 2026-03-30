'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'info', duration = 3000) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[90] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: <Check className="w-4 h-4 text-success" />,
    error: <AlertCircle className="w-4 h-4 text-error" />,
    info: <Info className="w-4 h-4 text-brand-light" />,
  };

  return (
    <div
      className={cn(
        'pointer-events-auto glass-card px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-sm animate-slide-up',
        toast.type === 'error' && 'border-error/30',
        toast.type === 'success' && 'border-success/30',
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-text-primary flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-text-secondary hover:text-text-primary transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
