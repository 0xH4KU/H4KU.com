import React from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';
import { Tooltip } from './Tooltip';
import styles from './Sidebar.module.css';

interface SidebarHeaderProps {
  allFoldersExpanded: boolean;
  onToggleAll: () => void;
  onLogoClick: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  allFoldersExpanded,
  onToggleAll,
  onLogoClick,
}) => {
  return (
    <div className={styles['sidebar-header']}>
      <button
        className={styles['logo-button']}
        onClick={onLogoClick}
        aria-label="LUM.BIO, Go to home"
      >
        LUM.BIO
      </button>
      <div className={styles['header-controls']}>
        <Tooltip
          content={
            allFoldersExpanded ? 'Collapse all folders' : 'Expand all folders'
          }
          position="bottom"
        >
          <button
            className={`${styles['control-button']} ${allFoldersExpanded ? styles['control-button--active'] : ''}`}
            onClick={onToggleAll}
            aria-label={
              allFoldersExpanded ? 'Collapse all folders' : 'Expand all folders'
            }
          >
            {allFoldersExpanded ? (
              <ChevronsUp size={16} />
            ) : (
              <ChevronsDown size={16} />
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
