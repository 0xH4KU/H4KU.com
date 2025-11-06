import React from 'react';
import profontWoff2 from '@/assets/fonts/ProFont.woff2';
import profontWoff from '@/assets/fonts/ProFont.woff';
import profontTtf from '@/assets/fonts/ProFont.ttf';
import profontBoldWoff2 from '@/assets/fonts/ProFont-Bold.woff2';
import profontBoldWoff from '@/assets/fonts/ProFont-Bold.woff';
import profontBoldTtf from '@/assets/fonts/ProFont-Bold.ttf';

const GlobalStyles: React.FC = () => (
  <style>{`
        @font-face {
          font-family: 'ProFont';
          src: url(${profontWoff2}) format('woff2'),
               url(${profontWoff}) format('woff'),
               url(${profontTtf}) format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'ProFont';
          src: url(${profontBoldWoff2}) format('woff2'),
               url(${profontBoldWoff}) format('woff'),
               url(${profontBoldTtf}) format('truetype');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --font-primary: 'ProFont', monospace;
          --font-size-base: 16px;
          --font-size-md: 15px;
          --font-size-sm: 14px;
          --font-size-xs: 12px;
          --font-size-xxs: 11px;
        }

        body {
          font-family: var(--font-primary);
          font-size: var(--font-size-base);
          overflow: hidden;
        }

        .app {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          transition: background-color 0.3s, color 0.3s;
          position: relative;
        }

        .app.light {
          background: #f5f5f5;
          color: #1a1a1a;
        }

        .app.dark {
          background: #1a1a1a;
          color: #e8e8e8;
        }

        /* Grid Background */
        .app::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .app::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(to right, var(--grid-bold) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-bold) 1px, transparent 1px);
          background-size: 96px 96px;
        }

        .light {
          --grid-line: rgba(0, 0, 0, 0.04);
          --grid-bold: rgba(0, 0, 0, 0.08);
        }

        .dark {
          --grid-line: rgba(255, 255, 255, 0.04);
          --grid-bold: rgba(255, 255, 255, 0.08);
        }

        /* Crosshair */
        .crosshair-x, .crosshair-y {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          transition: opacity 0.3s;
        }

        .crosshair-x {
          height: 1px;
          left: 0;
          right: 0;
          background: #689696;
          opacity: 0.5;
        }

        .crosshair-y {
          width: 1px;
          top: 0;
          bottom: 0;
          background: #689696;
          opacity: 0.5;
        }

        .crosshair-label {
          position: fixed;
          z-index: 10000;
          pointer-events: none;
          padding: 4px 8px;
          font-size: var(--font-size-xxs);
          border: 1px solid;
          background: rgba(0, 0, 0, 0.8);
          color: #689696;
          font-family: inherit;
          backdrop-filter: blur(4px);
          white-space: nowrap;
        }

        .light .crosshair-label {
          background: rgba(255, 255, 255, 0.9);
          border-color: #689696;
          color: #1a1a1a;
        }

        .dark .crosshair-label {
          background: rgba(0, 0, 0, 0.9);
          border-color: #689696;
          color: #689696;
        }

        /* Top Bar */
        .top-bar {
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          border-bottom: 2px solid;
          gap: 16px;
          position: relative;
          z-index: 10;
        }

        .light .top-bar {
          background: #e8e8e8;
          border-color: #d0d0d0;
        }

        .dark .top-bar {
          background: #0f0f0f;
          border-color: #333;
        }

        .nav-buttons {
          display: flex;
          gap: 8px;
        }

        .nav-btn, .theme-btn, .search-btn {
          width: 32px;
          height: 32px;
          border: 2px solid;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .light .nav-btn, .light .theme-btn, .light .search-btn {
          border-color: #1a1a1a;
          color: #1a1a1a;
        }

        .dark .nav-btn, .dark .theme-btn, .dark .search-btn {
          border-color: #e8e8e8;
          color: #e8e8e8;
        }

        .nav-btn:hover, .theme-btn:hover, .search-btn:hover {
          background: #689696;
          border-color: #689696;
          color: #fff;
        }

        .breadcrumb {
          flex: 1;
          font-size: var(--font-size-md);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breadcrumb-sep {
          color: #999;
        }

        .breadcrumb-link {
          background: transparent;
          border: none;
          color: inherit;
          font: inherit;
          padding: 0;
          cursor: pointer;
        }

        .breadcrumb-link:not([disabled]):hover {
          color: #689696;
        }

        .breadcrumb-link[disabled] {
          cursor: default;
          opacity: 0.7;
        }

        /* Main Layout */
        .main-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
          z-index: 10;
        }

        /* Sidebar */
        .sidebar {
          position: relative;
          height: 100%;
          border-right: 2px solid;
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s;
        }

        .light .sidebar {
          background: #e8e8e8;
          border-color: #d0d0d0;
        }

        .dark .sidebar {
          background: #0f0f0f;
          border-color: #333;
        }

        .sidebar.collapsed {
          margin-left: -240px;
        }

        .sidebar-header {
          padding: 24px 16px;
          font-size: 20px;
          font-weight: bold;
          letter-spacing: 2px;
          border-bottom: 2px solid;
        }

        .light .sidebar-header {
          border-color: #d0d0d0;
        }

        .dark .sidebar-header {
          border-color: #333;
        }

        .sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px 0;
        }

        .sidebar-section {
          margin-bottom: 24px;
        }

        .sidebar-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .sidebar-item:hover {
          background: rgba(104, 150, 150, 0.1);
          border-left-color: #689696;
        }

        .sidebar-item.active {
          background: rgba(104, 150, 150, 0.2);
          border-left-color: #689696;
        }

        .sidebar-icon,
        .txt-icon {
          width: 36px;
          height: 36px;
          display: block;
          flex-shrink: 0;
          object-fit: contain;
          opacity: 0.85;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 2px solid;
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .light .sidebar-footer {
          border-color: #d0d0d0;
        }

        .dark .sidebar-footer {
          border-color: #333;
        }

        .social-link {
          padding: 8px 12px;
          border: 2px solid;
          background: transparent;
          cursor: pointer;
          font-size: var(--font-size-sm);
          transition: all 0.2s;
          text-decoration: none;
          color: inherit;
        }

        .light .social-link {
          border-color: #1a1a1a;
        }

        .dark .social-link {
          border-color: #e8e8e8;
        }

        .social-link:hover {
          background: #e87722;
          border-color: #e87722;
          color: #fff;
        }

        .resize-handle {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          cursor: col-resize;
          transition: background 0.2s;
        }

        .resize-handle:hover {
          background: #689696;
        }

        /* Content Area */
        .content-area {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        .file-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 24px;
        }

        .file-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .file-item:hover {
          transform: translateY(-2px);
          border-color: #e87722;
          box-shadow: 0 4px 12px rgba(232, 119, 34, 0.15);
        }

        .file-icon {
          width: 96px;
          height: 96px;
          display: block;
          object-fit: contain;
          flex-shrink: 0;
        }

        .file-name {
          font-size: var(--font-size-sm);
          text-align: center;
          word-break: break-word;
        }

        /* Works Grid */
        .works-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 24px;
        }

        .folder-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .folder-empty {
          font-size: var(--font-size-sm);
          opacity: 0.6;
          padding: 16px;
        }

        .work-item {
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
          overflow: hidden;
        }

        .work-item:hover {
          transform: translateY(-4px);
          border-color: #e87722;
          box-shadow: 0 8px 16px rgba(232, 119, 34, 0.2);
        }

        .work-item img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }

        .work-info {
          padding: 8px;
          font-size: var(--font-size-xs);
          text-align: center;
          border-top: 2px solid;
        }

        .light .work-info {
          border-color: #d0d0d0;
          background: #fff;
        }

        .dark .work-info {
          border-color: #333;
          background: #0f0f0f;
        }

        /* TXT Viewer */
        .txt-viewer {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid;
        }

        .light .txt-viewer {
          border-color: #1a1a1a;
          background: #fff;
        }

        .dark .txt-viewer {
          border-color: #e8e8e8;
          background: #0f0f0f;
        }

        .txt-header {
          padding: 12px 16px;
          border-bottom: 2px solid;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .light .txt-header {
          border-color: #d0d0d0;
          background: #f5f5f5;
        }

        .dark .txt-header {
          border-color: #333;
          background: #1a1a1a;
        }

        .close-btn {
          margin-left: auto;
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: inherit;
        }

        .close-btn:hover {
          color: #e87722;
        }

        .txt-content {
          padding: 24px;
        }

        .txt-content pre {
          font-family: inherit;
          font-size: var(--font-size-md);
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* Lightbox */
        .lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 40px;
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: 2px solid #fff;
          color: #fff;
          font-size: 24px;
          width: 48px;
          height: 48px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .lightbox-close:hover {
          background: #e87722;
          border-color: #e87722;
        }

        .lightbox-image {
          max-width: 100%;
          max-height: calc(100vh - 160px);
          object-fit: contain;
        }

        .lightbox-info {
          margin-top: 20px;
          color: #fff;
          font-size: var(--font-size-sm);
          display: flex;
          gap: 20px;
        }

        /* Bottom Status Bar */
        .status-bar {
          height: 32px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          border-top: 2px solid;
          font-size: var(--font-size-xs);
          gap: 16px;
          position: relative;
          z-index: 10;
        }

        .light .status-bar {
          background: #e8e8e8;
          border-color: #d0d0d0;
        }

        .dark .status-bar {
          background: #0f0f0f;
          border-color: #333;
        }

        .status-socials {
          display: flex;
          gap: 8px;
        }

        .status-socials a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }

        .status-socials a:hover {
          color: #e87722;
        }

        /* Search Panel */
        .search-panel {
          position: fixed;
          top: 56px;
          right: 32px;
          width: 320px;
          max-width: calc(100vw - 48px);
          border: 2px solid;
          z-index: 2000;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
        }

        .light .search-panel {
          background: #fff;
          border-color: #1a1a1a;
        }

        .dark .search-panel {
          background: #0f0f0f;
          border-color: #e8e8e8;
        }

        .search-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 2px solid;
        }

        .light .search-header {
          border-color: #d0d0d0;
        }

        .dark .search-header {
          border-color: #333;
        }

        .search-header input {
          flex: 1;
          background: transparent;
          border: none;
          font: inherit;
          font-size: var(--font-size-md);
          color: inherit;
          outline: none;
        }

        .search-close-btn {
          background: transparent;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: inherit;
        }

        .search-close-btn:hover {
          color: #e87722;
        }

        .search-results {
          max-height: 320px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .search-result {
          text-align: left;
          padding: 12px 16px;
          border: none;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
          border-bottom: 1px solid;
        }

        .search-result:last-child {
          border-bottom: none;
        }

        .light .search-result {
          border-color: #f0f0f0;
        }

        .dark .search-result {
          border-color: #1f1f1f;
        }

        .search-result:hover {
          background: rgba(232, 119, 34, 0.1);
          color: #e87722;
        }

        .search-result-label {
          font-size: var(--font-size-md);
        }

        .search-result-meta {
          font-size: var(--font-size-xs);
          opacity: 0.7;
          margin-top: 4px;
        }

        .search-hint,
        .search-empty {
          padding: 16px;
          font-size: var(--font-size-sm);
          opacity: 0.7;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            position: absolute;
            left: 0;
            top: 48px;
            bottom: 32px;
            z-index: 100;
            margin-left: -240px;
          }

          .sidebar.open {
            margin-left: 0;
          }

          .file-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 16px;
          }

          .works-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .content-area {
            padding: 16px;
          }
        }
      `}</style>
);

export default GlobalStyles;
