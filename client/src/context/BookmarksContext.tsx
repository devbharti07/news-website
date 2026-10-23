import React, { createContext, useContext, useEffect, useState } from 'react';
import { NewsArticle } from '../types/news';

interface BookmarksContextType {
  bookmarks: NewsArticle[];
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (article: NewsArticle) => void;
  removeBookmark: (id: string) => void;
  clearAllBookmarks: () => void;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem('chronicle_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('chronicle_bookmarks', JSON.stringify(bookmarks));
    } catch (err) {
      console.error('Failed to save bookmarks to localStorage:', err);
    }
  }, [bookmarks]);

  const isBookmarked = (id: string) => {
    return bookmarks.some(b => b.id === id);
  };

  const toggleBookmark = (article: NewsArticle) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === article.id);
      if (exists) {
        return prev.filter(b => b.id !== article.id);
      } else {
        return [article, ...prev];
      }
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const clearAllBookmarks = () => {
    setBookmarks([]);
  };

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
        clearAllBookmarks,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
