import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  useEffect(() => {
    const timers: number[] = [];

    toasts.forEach((toast) => {
      const timer = window.setTimeout(() => {
        onRemove(toast.id);
      }, 5000);
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
    };
  }, [toasts, onRemove]);

  // Limitar a 2 toasts máximo
  const visibleToasts = toasts.slice(-2);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {visibleToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-card min-w-[300px] bg-white ${
              toast.type === 'success'
                ? 'border border-green-500/50'
                : 'border border-red-500/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            )}
            <p className="flex-1 text-sm font-medium text-gray-900">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="hover:bg-primary-500/20 rounded p-1 transition-colors text-gray-900/70 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
