import React from 'react';

export default function Modal({
  title, open, onClose, children, maxWidth = 'max-w-2xl'
}:{
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-[95%] ${maxWidth} mx-auto mt-10`}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
