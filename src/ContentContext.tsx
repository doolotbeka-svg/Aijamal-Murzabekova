import React, { createContext, useContext, useEffect, useState } from 'react';
import { defaultContent, mergeContent, type SiteContent } from './data/content';

interface ContentState {
  content: SiteContent;
  /** Replaces the content shown on the page (used by the admin editor after saving). */
  setContent: (content: SiteContent) => void;
}

const ContentContext = createContext<ContentState>({ content: defaultContent, setContent: () => {} });

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Render the built-in texts immediately, then swap in what the teacher saved in the admin panel
  const [content, setContent] = useState<SiteContent>(defaultContent);

  useEffect(() => {
    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setContent(mergeContent(data)))
      .catch(() => {});
  }, []);

  return <ContentContext.Provider value={{ content, setContent }}>{children}</ContentContext.Provider>;
};

export function useContent() {
  return useContext(ContentContext).content;
}

export function useContentState() {
  return useContext(ContentContext);
}
