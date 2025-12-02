import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarFilterProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  query,
  onQueryChange,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  const handleClear = () => {
    onQueryChange('');
  };

  return (
    <div className={styles['search-container']}>
      <Search size={16} className={styles['search-icon']} />
      <input
        type="text"
        placeholder="Filter sidebar..."
        value={query}
        onChange={handleChange}
        className={styles['search-input']}
        aria-label="Filter sidebar items"
        aria-describedby="sidebar-filter-help"
      />
      {query && (
        <button
          className={styles['search-clear']}
          onClick={handleClear}
          aria-label="Clear filter"
          type="button"
        >
          <X size={16} />
        </button>
      )}
      <span id="sidebar-filter-help" className={styles['sr-only']}>
        Type to filter sidebar navigation. Use global search (top right) to
        search all content.
      </span>
    </div>
  );
};
