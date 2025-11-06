import React from 'react';
import { Social } from '@/types';

interface StatusBarProps {
  socials: Social[];
  itemCount: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ socials, itemCount }) => (
  <div className="status-bar">
    <div className="status-socials">
      {socials.map((social) => (
        <a key={social.code} href={social.url} target="_blank" rel="noopener noreferrer">
          [{social.code}]
        </a>
      ))}
    </div>
    <span>|</span>
    <span>{itemCount} items</span>
    <span>|</span>
    <span style={{ fontSize: 'var(--font-size-xxs)', opacity: 0.6 }}>
      Press ESC to toggle crosshair
    </span>
    <span style={{ marginLeft: 'auto' }}>© 2025 lum.bio</span>
  </div>
);

export default StatusBar;
