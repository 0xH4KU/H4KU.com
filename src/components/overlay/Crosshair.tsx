import React, { useEffect } from 'react';
import { useCrosshair } from '@/hooks/useCrosshair';
import { setRuntimeCssVars } from '@/utils/runtimeCssVars';
import styles from './Crosshair.module.css';

const LINE_THICKNESS = 1;
const LABEL_OFFSET = 12;

const Crosshair: React.FC = () => {
  const { showCrosshair, mousePos, isHoveringInteractive } = useCrosshair();

  const hasWindow = typeof window !== 'undefined';
  const maxX = hasWindow ? window.innerWidth - 120 : mousePos.x + LABEL_OFFSET;
  const maxY = hasWindow ? window.innerHeight - 40 : mousePos.y + LABEL_OFFSET;
  const labelX = Math.min(mousePos.x + LABEL_OFFSET, maxX);
  const labelY = Math.min(mousePos.y + LABEL_OFFSET, maxY);

  useEffect(() => {
    setRuntimeCssVars({
      '--crosshair-x': `${mousePos.x}px`,
      '--crosshair-y': `${mousePos.y}px`,
      '--crosshair-line-x': `${mousePos.x - LINE_THICKNESS / 2}px`,
      '--crosshair-line-y': `${mousePos.y - LINE_THICKNESS / 2}px`,
      '--crosshair-label-x': `${labelX}px`,
      '--crosshair-label-y': `${labelY}px`,
    });
  }, [mousePos.x, mousePos.y, labelX, labelY]);

  if (!showCrosshair) {
    return null;
  }

  return (
    <div aria-hidden="true">
      <div className={styles['crosshair-x']} />
      <div className={styles['crosshair-y']} />
      <div
        className={`${styles['crosshair-center']} ${
          isHoveringInteractive ? styles['interactive'] : ''
        }`}
      />
      <div className={styles['crosshair-label']}>
        {Math.round(mousePos.x)}, {Math.round(mousePos.y)} | col{' '}
        {Math.round(mousePos.x / 24)}, row {Math.round(mousePos.y / 24)}
      </div>
    </div>
  );
};

export default Crosshair;
