'use client';

import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  useEffect(() => {
    document.title = `${title} — Удачный`;
  }, [title]);
  return null;
};

export default PageTitle;
