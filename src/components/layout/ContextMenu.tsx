import React, { useEffect, useRef } from 'react';
import { Pin, PinOff, ExternalLink, Copy, FolderOpen } from 'lucide-react';
import styles from './ContextMenu.module.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  itemId: string;
  itemName: string;
  itemType: 'folder' | 'page';
  isPinned: boolean;
  onTogglePin: () => void;
  onCopyLink: () => void;
  onOpen?: () => void;
  onOpenInNewTab?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  itemName,
  itemType,
  isPinned,
  onTogglePin,
  onCopyLink,
  onOpen,
  onOpenInNewTab,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('contextmenu', onClose);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('contextmenu', onClose);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className={styles['context-menu']}
      style={{ left: x, top: y }}
      role="menu"
    >
      <div className={styles['context-menu-header']}>{itemName}</div>

      <button
        className={styles['context-menu-item']}
        onClick={() => {
          onTogglePin();
          onClose();
        }}
        role="menuitem"
      >
        {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
        <span>{isPinned ? 'Unpin' : 'Pin'}</span>
      </button>

      {itemType === 'folder' && onOpen && (
        <button
          className={styles['context-menu-item']}
          onClick={() => {
            onOpen();
            onClose();
          }}
          role="menuitem"
        >
          <FolderOpen size={16} />
          <span>Open</span>
        </button>
      )}

      <button
        className={styles['context-menu-item']}
        onClick={() => {
          onCopyLink();
          onClose();
        }}
        role="menuitem"
      >
        <Copy size={16} />
        <span>Copy Link</span>
      </button>

      {onOpenInNewTab && (
        <button
          className={styles['context-menu-item']}
          onClick={() => {
            onOpenInNewTab();
            onClose();
          }}
          role="menuitem"
        >
          <ExternalLink size={16} />
          <span>Open in New Tab</span>
        </button>
      )}
    </div>
  );
};
