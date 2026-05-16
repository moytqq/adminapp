'use client';

import React, { useState, memo } from 'react';
import styles from './UserAvatar.module.scss';

const FILES_URL = process.env.NEXT_PUBLIC_FILES_URL ?? '';

interface UserAvatarProps {
  hid: number | null;
  name?: string;
  size?: number;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

const UserAvatar = memo(({ hid, name = '', size = 40, className }: UserAvatarProps) => {
  const [error, setError] = useState(false);
  const src = hid ? `${FILES_URL}/files/avatar_${hid}.jpg` : null;
  const initials = getInitials(name);

  const style: React.CSSProperties = { width: size, height: size, fontSize: size * 0.36 };

  if (!src || error) {
    return (
      <div className={`${styles.avatar} ${styles.fallback} ${className ?? ''}`} style={style}>
        {initials || <span className={styles.defaultIcon}>?</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${styles.avatar} ${className ?? ''}`}
      style={style}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
});

UserAvatar.displayName = 'UserAvatar';
export default UserAvatar;
