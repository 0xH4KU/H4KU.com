import React from 'react';
import folderIcon from '@/assets/folder.gif';
import paperIcon from '@/assets/paper.gif';
import { Folder, Page, Social } from '@/types';

type SidebarEntry = Folder | Page;

interface SidebarProps {
  width: number;
  collapsed: boolean;
  folders: Folder[];
  pages: Page[];
  socials: Social[];
  onNavigate: (item: SidebarEntry) => void;
  onDragStart: () => void;
  activePath: string[];
}

const Sidebar: React.FC<SidebarProps> = ({
  width,
  collapsed,
  folders,
  pages,
  socials,
  onNavigate,
  onDragStart,
  activePath,
}) => (
  <div className="sidebar" style={{ width: collapsed ? 0 : width }}>
    <div className="sidebar-header">LUM.BIO</div>

    <div className="sidebar-content">
      <div className="sidebar-section">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`sidebar-item${activePath.includes(folder.id) ? ' active' : ''}`}
            onClick={() => onNavigate(folder)}
          >
            <img className="sidebar-icon" src={folderIcon} alt="Folder icon" />
            <span>{folder.name}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`sidebar-item${activePath.includes(page.id) ? ' active' : ''}`}
            onClick={() => onNavigate(page)}
          >
            <img className="sidebar-icon" src={paperIcon} alt="Text file icon" />
            <span>{page.name}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="sidebar-footer">
      {socials.map((social) => (
        <a
          key={social.code}
          href={social.url}
          className="social-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {social.code}
        </a>
      ))}
    </div>

    <div className="resize-handle" onMouseDown={onDragStart} />
  </div>
);

export default Sidebar;
