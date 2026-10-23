import React from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

interface NewStoriesNotificationProps {
  count: number;
  onShow: () => void;
}

export function NewStoriesNotification({ count, onShow }: NewStoriesNotificationProps) {
  if (count <= 0) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 animate-bounce">
      <button
        onClick={onShow}
        className="flex items-center gap-2 px-4 py-2 rounded-full shadow-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-semibold tracking-wide border border-gray-700/50 dark:border-gray-200 transition-transform active:scale-95"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>{count} new stories available</span>
        <ArrowUp className="w-3.5 h-3.5 ml-1" />
      </button>
    </div>
  );
}
