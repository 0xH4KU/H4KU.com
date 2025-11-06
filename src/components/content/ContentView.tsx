import React from 'react';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { Folder, MockData, Page, ViewType, WorkItem } from '@/types';

type NavigableItem = Folder | Page;

interface ContentViewProps {
  currentView: ViewType | null;
  data: MockData;
  onNavigate: (item: NavigableItem) => void;
  onOpenLightbox: (item: WorkItem) => void;
  onCloseTextView: () => void;
  theme: 'light' | 'dark';
}

const ContentView: React.FC<ContentViewProps> = ({
  currentView,
  data,
  onNavigate,
  onOpenLightbox,
  onCloseTextView,
  theme,
}) => {
  if (currentView?.type === 'txt') {
    return (
      <div className={`txt-viewer ${theme}`}>
        <div className="txt-header">
          <img className="txt-icon" src={paperIcon} alt="Text file icon" />
          <span>{currentView.data.name}</span>
          <button onClick={onCloseTextView} className="close-btn">
            ×
          </button>
        </div>
        <div className="txt-content">
          <pre>{currentView.data.content}</pre>
        </div>
      </div>
    );
  }

  if (currentView?.type === 'folder') {
    const { items = [], children = [] } = currentView.data;

    if (!items.length && !children.length) {
      return <div className="folder-empty">No items in this folder yet.</div>;
    }

    return (
      <div className="folder-content">
        {children.length > 0 && (
          <div className="file-grid">
            {children.map((child) => (
              <div
                key={child.id}
                className="file-item"
                onClick={() => onNavigate(child)}
              >
                <img className="file-icon" src={folderIcon} alt="Folder icon" />
                <div className="file-name">{child.name}</div>
              </div>
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div className="works-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className="work-item"
                onClick={() => onOpenLightbox(item)}
              >
                <img src={item.thumb} alt={item.filename} />
                <div className="work-info">{item.filename}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="file-grid">
      {data.folders.map((folder) => (
        <div
          key={folder.id}
          className="file-item"
          onClick={() => onNavigate(folder)}
        >
          <img className="file-icon" src={folderIcon} alt="Folder icon" />
          <div className="file-name">{folder.name}</div>
        </div>
      ))}
      {data.pages.map((page) => (
        <div
          key={page.id}
          className="file-item"
          onClick={() => onNavigate(page)}
        >
          <img className="file-icon" src={paperIcon} alt="Text file icon" />
          <div className="file-name">{page.name}</div>
        </div>
      ))}
    </div>
  );
};

export default ContentView;
