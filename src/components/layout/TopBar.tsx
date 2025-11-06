import React from 'react';
import { ChevronLeft, ChevronRight, Moon, Sun, Search } from 'lucide-react';

interface TopBarProps {
  pathSegments: { id: string; label: string }[];
  canGoBack: boolean;
  onBack: () => void;
  onToggleSearch: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  isSearchOpen: boolean;
  onSelectPath: (index: number) => void;
}

const TopBar: React.FC<TopBarProps> = ({
  pathSegments,
  canGoBack,
  onBack,
  onToggleSearch,
  onToggleTheme,
  theme,
  isSearchOpen,
  onSelectPath,
}) => (
  <div className="top-bar">
    <div className="nav-buttons">
      <button className="nav-btn" onClick={onBack} disabled={!canGoBack}>
        <ChevronLeft size={16} />
      </button>
      <button className="nav-btn" disabled>
        <ChevronRight size={16} />
      </button>
    </div>

    <div className="breadcrumb">
      {pathSegments.map((segment, idx) => {
        const isActive = idx === pathSegments.length - 1;
        return idx === 0 ? (
          <button
            key={segment.id}
            type="button"
            className="breadcrumb-link"
            onClick={() => onSelectPath(idx)}
            disabled={isActive}
          >
            lum.bio
          </button>
        ) : (
          <React.Fragment key={`${segment.id}-${idx}`}>
            <span className="breadcrumb-sep">/</span>
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onSelectPath(idx)}
              disabled={isActive}
            >
              {segment.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>

    <button
      className="search-btn"
      onClick={onToggleSearch}
      aria-pressed={isSearchOpen}
    >
      <Search size={16} />
    </button>

    <button className="theme-btn" onClick={onToggleTheme}>
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  </div>
);

export default TopBar;
