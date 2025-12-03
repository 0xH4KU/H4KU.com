import React from 'react';
import { useCrosshair } from '@/hooks/useCrosshair';
import styles from './Crosshair.module.css';

const LINE_THICKNESS = 1;
const LABEL_OFFSET = 12;

const Crosshair: React.FC = () => {
  const { showCrosshair, mousePos, isHoveringInteractive } = useCrosshair();

  if (!showCrosshair) {
    return null;
  }

  const hasWindow = typeof window !== 'undefined';
  const maxX = hasWindow ? window.innerWidth - 120 : mousePos.x + LABEL_OFFSET;
  const maxY = hasWindow ? window.innerHeight - 40 : mousePos.y + LABEL_OFFSET;
  const labelX = Math.min(mousePos.x + LABEL_OFFSET, maxX);
  const labelY = Math.min(mousePos.y + LABEL_OFFSET, maxY);

  return (
    <div aria-hidden="true">
      <div
        className={styles['crosshair-x']}
        style={{
          transform: `translateY(${mousePos.y - LINE_THICKNESS / 2}px)`,
        }}
      />
      <div
        className={styles['crosshair-y']}
        style={{
          transform: `translateX(${mousePos.x - LINE_THICKNESS / 2}px)`,
        }}
      />
      <div
        className={`${styles['crosshair-center']} ${
          isHoveringInteractive ? styles['interactive'] : ''
        }`}
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
        }}
      />
      <div
        className={styles['crosshair-label']}
        style={{ transform: `translate(${labelX}px, ${labelY}px)` }}
      >
        {Math.round(mousePos.x)}, {Math.round(mousePos.y)} | col{' '}
        {Math.round(mousePos.x / 24)}, row {Math.round(mousePos.y / 24)}
      </div>
    </div>
  );
};

export default Crosshair;
